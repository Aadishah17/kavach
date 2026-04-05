import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Firestore } from '@google-cloud/firestore'
import type {
  ClaimTimelineRecord,
  FeatureFlagRecord,
  FraudReviewAction,
  FraudReviewRecord,
  NotificationRecord,
  OtpChallengeRecord,
  PayoutRecord,
  ProfileSetting,
  SessionRecord,
  StoredUser,
  SupportTicketRecord,
} from './types.js'
import { buildDemoUser, defaultProfileSettings } from './seed.js'

const SESSION_TTL_DAYS = 30

export class FirestoreStore {
  private db: Firestore

  constructor() {
    this.db = new Firestore()
  }

  async init() {
    await this.ensureDemoUser()
  }

  close() {
    // Firestore client doesn't need explicit close in most cases
  }

  // ─── Users ───────────────────────────────────────────────

  async getUserById(userId: string): Promise<StoredUser | null> {
    const doc = await this.db.collection('users').doc(userId).get()
    return doc.exists ? (doc.data() as StoredUser) : null
  }

  async getUserByPhone(phone: string): Promise<StoredUser | null> {
    const normalized = normalizePhone(phone)
    const snapshot = await this.db
      .collection('users')
      .where('phoneNormalized', '==', normalized)
      .limit(1)
      .get()

    if (snapshot.empty) return null
    const [doc] = snapshot.docs
    if (!doc) return null
    return doc.data() as StoredUser
  }

  async getUserByEmail(email: string): Promise<StoredUser | null> {
    const normalized = email.trim().toLowerCase()
    const snapshot = await this.db
      .collection('users')
      .where('emailLowercase', '==', normalized)
      .limit(1)
      .get()

    if (snapshot.empty) return null
    const [doc] = snapshot.docs
    if (!doc) return null
    return doc.data() as StoredUser
  }

  async upsertUser(user: StoredUser): Promise<StoredUser> {
    const docRef = this.db.collection('users').doc(user.id)
    const data = {
      ...user,
      phoneNormalized: normalizePhone(user.phone),
      emailLowercase: user.email?.trim().toLowerCase() ?? null,
    }
    await docRef.set(data, { merge: true })

    // Ensure default profile settings
    const settingsSnap = await this.db
      .collection('profileSettings')
      .doc(user.id)
      .get()

    if (!settingsSnap.exists) {
      await this.updateProfileSettings(user.id, defaultProfileSettings)
    }

    return (await this.getUserById(user.id))!
  }

  // ─── Sessions ────────────────────────────────────────────

  async createSession(userId: string) {
    const token = randomBytes(32).toString('base64url')
    const now = new Date().toISOString()
    const expiresAt = addDays(now, SESSION_TTL_DAYS)
    const session: SessionRecord = {
      id: randomUUID(),
      userId,
      createdAt: now,
      lastSeenAt: now,
      expiresAt,
      revokedAt: null,
    }

    await this.db.collection('sessions').doc(session.id).set({
      ...session,
      tokenHash: hashToken(token),
    })

    // Update user last login
    await this.db.collection('users').doc(userId).update({
      lastLoginAt: now,
      updatedAt: now,
    })

    return { token, session }
  }

  async getSession(token: string): Promise<SessionRecord | null> {
    const hash = hashToken(token)
    const snapshot = await this.db
      .collection('sessions')
      .where('tokenHash', '==', hash)
      .where('revokedAt', '==', null)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const [doc] = snapshot.docs
    if (!doc) return null

    const data = doc.data()
    // Check expiry
    if (new Date(data.expiresAt) <= new Date()) return null

    return {
      id: data.id,
      userId: data.userId,
      createdAt: data.createdAt,
      lastSeenAt: data.lastSeenAt,
      expiresAt: data.expiresAt,
      revokedAt: data.revokedAt,
    }
  }

  async touchSession(token: string): Promise<SessionRecord | null> {
    const hash = hashToken(token)
    const now = new Date().toISOString()
    const expiresAt = addDays(now, SESSION_TTL_DAYS)

    const snapshot = await this.db
      .collection('sessions')
      .where('tokenHash', '==', hash)
      .where('revokedAt', '==', null)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const [doc] = snapshot.docs
    if (!doc) return null

    await doc.ref.update({ lastSeenAt: now, expiresAt })
    return this.getSession(token)
  }

  async revokeSession(token: string): Promise<boolean> {
    const hash = hashToken(token)
    const snapshot = await this.db
      .collection('sessions')
      .where('tokenHash', '==', hash)
      .where('revokedAt', '==', null)
      .limit(1)
      .get()

    if (snapshot.empty) return false

    const [doc] = snapshot.docs
    if (!doc) return false

    await doc.ref.update({ revokedAt: new Date().toISOString() })
    return true
  }

  // ─── Profile Settings ────────────────────────────────────

  async getProfileSettings(userId: string): Promise<ProfileSetting[]> {
    const doc = await this.db.collection('profileSettings').doc(userId).get()
    if (!doc.exists) return this.clone(defaultProfileSettings)

    const data = doc.data()
    return (data?.settings as ProfileSetting[]) ?? this.clone(defaultProfileSettings)
  }

  async updateProfileSettings(userId: string, settings: ProfileSetting[]): Promise<ProfileSetting[]> {
    await this.db.collection('profileSettings').doc(userId).set({ settings })
    return this.getProfileSettings(userId)
  }

  async createOtpChallenge(challenge: OtpChallengeRecord) {
    await this.db.collection('otpChallenges').doc(challenge.id).set(challenge)
    return (await this.getOtpChallenge(challenge.id))!
  }

  async getOtpChallenge(id: string): Promise<OtpChallengeRecord | null> {
    const doc = await this.db.collection('otpChallenges').doc(id).get()
    return doc.exists ? (doc.data() as OtpChallengeRecord) : null
  }

  async updateOtpChallenge(challenge: OtpChallengeRecord) {
    await this.db.collection('otpChallenges').doc(challenge.id).set(challenge, { merge: true })
    return (await this.getOtpChallenge(challenge.id))!
  }

  async listNotifications(userId: string): Promise<NotificationRecord[]> {
    const snapshot = await this.db
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => doc.data() as NotificationRecord)
  }

  async createNotification(notification: NotificationRecord) {
    await this.db.collection('notifications').doc(notification.id).set(notification)
    return notification
  }

  async listClaimTimeline(userId: string, claimId?: string): Promise<ClaimTimelineRecord[]> {
    let query = this.db.collection('claimTimeline').where('userId', '==', userId)
    if (claimId) {
      query = query.where('claimId', '==', claimId)
    }

    const snapshot = await query.orderBy('createdAt', 'asc').get()
    return snapshot.docs.map((doc) => doc.data() as ClaimTimelineRecord)
  }

  async appendClaimTimeline(event: ClaimTimelineRecord) {
    await this.db.collection('claimTimeline').doc(event.id).set(event)
    return event
  }

  async upsertPayoutRecord(record: PayoutRecord) {
    await this.db.collection('payoutRecords').doc(record.reference).set(record, { merge: true })
    return (await this.getPayoutRecord(record.reference))!
  }

  async getPayoutRecord(reference: string): Promise<PayoutRecord | null> {
    const doc = await this.db.collection('payoutRecords').doc(reference).get()
    return doc.exists ? (doc.data() as PayoutRecord) : null
  }

  async listPayoutRecords(userId?: string): Promise<PayoutRecord[]> {
    const query = userId
      ? this.db.collection('payoutRecords').where('userId', '==', userId)
      : this.db.collection('payoutRecords')

    const snapshot = await query.orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => doc.data() as PayoutRecord)
  }

  async upsertSupportTicket(ticket: SupportTicketRecord) {
    await this.db.collection('supportTickets').doc(ticket.ticketId).set(ticket, { merge: true })
    return (await this.getLatestSupportTicket(ticket.userId))!
  }

  async listSupportTickets(userId: string): Promise<SupportTicketRecord[]> {
    const snapshot = await this.db
      .collection('supportTickets')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => doc.data() as SupportTicketRecord)
  }

  async getLatestSupportTicket(userId: string): Promise<SupportTicketRecord | null> {
    const snapshot = await this.db
      .collection('supportTickets')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()

    if (snapshot.empty) return null
    const [doc] = snapshot.docs
    return doc ? (doc.data() as SupportTicketRecord) : null
  }

  async upsertFraudReview(review: FraudReviewRecord) {
    await this.db.collection('fraudReviews').doc(review.id).set(review, { merge: true })
    return (await this.getFraudReview(review.id))!
  }

  async getFraudReview(id: string): Promise<FraudReviewRecord | null> {
    const doc = await this.db.collection('fraudReviews').doc(id).get()
    return doc.exists ? (doc.data() as FraudReviewRecord) : null
  }

  async listFraudReviews(): Promise<FraudReviewRecord[]> {
    const snapshot = await this.db.collection('fraudReviews').orderBy('updatedAt', 'desc').get()
    return snapshot.docs.map((doc) => doc.data() as FraudReviewRecord)
  }

  async applyFraudReviewAction(id: string, action: FraudReviewAction) {
    const current = await this.getFraudReview(id)
    if (!current) {
      return null
    }

    const status = action === 'approve'
      ? 'approved'
      : action === 'reject'
        ? 'rejected'
        : action === 'escalate'
          ? 'escalated'
          : 'resolved'

    const updated: FraudReviewRecord = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      resolutionNote: `Updated via ${action} action`,
    }

    await this.db.collection('fraudReviews').doc(id).set(updated, { merge: true })
    return updated
  }

  async getFeatureFlags(): Promise<FeatureFlagRecord[]> {
    const snapshot = await this.db.collection('featureFlags').orderBy('key').get()
    return snapshot.docs.map((doc) => doc.data() as FeatureFlagRecord)
  }

  async upsertFeatureFlag(flag: FeatureFlagRecord) {
    await this.db.collection('featureFlags').doc(flag.key).set(flag, { merge: true })
    const doc = await this.db.collection('featureFlags').doc(flag.key).get()
    return doc.exists ? (doc.data() as FeatureFlagRecord) : null
  }

  // ─── Private ─────────────────────────────────────────────

  private async ensureDemoUser() {
    const existing = await this.getUserById('user-demo')
    if (!existing) {
      await this.upsertUser(buildDemoUser())
    }
  }

  private clone<T>(value: T) {
    return JSON.parse(JSON.stringify(value)) as T
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}
