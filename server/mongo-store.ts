import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { MongoClient, type Db, type Filter, type WithId } from 'mongodb'
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
import { defaultProfileSettings } from './seed.js'
import { ensureDemoLiveData } from './demo-live-data.js'

const SESSION_TTL_DAYS = 30

type UserDocument = StoredUser & {
  _id: string
  phoneNormalized: string
  emailLowercase: string | null
}

type SessionDocument = SessionRecord & {
  _id: string
  tokenHash: string
}

type ProfileSettingsDocument = {
  _id: string
  userId: string
  settings: ProfileSetting[]
}

type OtpChallengeDocument = OtpChallengeRecord & {
  _id: string
}

type NotificationDocument = NotificationRecord & {
  _id: string
}

type ClaimTimelineDocument = ClaimTimelineRecord & {
  _id: string
}

type PayoutRecordDocument = PayoutRecord & {
  _id: string
}

type SupportTicketDocument = SupportTicketRecord & {
  _id: string
}

type FraudReviewDocument = FraudReviewRecord & {
  _id: string
}

type FeatureFlagDocument = FeatureFlagRecord & {
  _id: string
}

export class MongoStore {
  private readonly client: MongoClient
  private readonly dbName: string
  private db: Db | null = null

  constructor(uri: string, options?: { dbName?: string }) {
    this.client = new MongoClient(uri, {
      appName: process.env.MONGODB_APP_NAME ?? 'Kavach',
    })
    this.dbName = options?.dbName ?? process.env.MONGODB_DB_NAME ?? 'kavach'
  }

  async init() {
    await this.client.connect()
    this.db = this.client.db(this.dbName)
    await this.ensureIndexes()
    await this.purgeExpiredSessions()
    await ensureDemoLiveData(this)
  }

  async close() {
    await this.client.close()
    this.db = null
  }

  async getUserById(userId: string) {
    const document = await this.users().findOne({ _id: userId })
    return document ? this.mapUser(document) : null
  }

  async getUserByPhone(phone: string) {
    const document = await this.users().findOne({ phoneNormalized: normalizePhone(phone) })
    return document ? this.mapUser(document) : null
  }

  async getUserByEmail(email: string) {
    const document = await this.users().findOne({ emailLowercase: normalizeEmail(email) })
    return document ? this.mapUser(document) : null
  }

  async upsertUser(user: StoredUser) {
    const document = toUserDocument(user)

    await this.users().updateOne(
      { _id: document._id },
      { $set: document },
      { upsert: true },
    )

    await this.profileSettings().updateOne(
      { _id: user.id },
      {
        $setOnInsert: {
          _id: user.id,
          userId: user.id,
          settings: clone(defaultProfileSettings),
        },
      },
      { upsert: true },
    )

    return (await this.getUserById(user.id))!
  }

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

    await this.sessions().insertOne({
      _id: session.id,
      ...session,
      tokenHash: hashToken(token),
    })

    await this.users().updateOne(
      { _id: userId },
      {
        $set: {
          lastLoginAt: now,
          updatedAt: now,
        },
      },
    )

    return { token, session }
  }

  async getSession(token: string) {
    const document = await this.sessions().findOne({
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date().toISOString() },
    })

    return document ? this.mapSession(document) : null
  }

  async touchSession(token: string) {
    const now = new Date().toISOString()
    const expiresAt = addDays(now, SESSION_TTL_DAYS)
    const result = await this.sessions().findOneAndUpdate(
      {
        tokenHash: hashToken(token),
        revokedAt: null,
      },
      {
        $set: {
          lastSeenAt: now,
          expiresAt,
        },
      },
      { returnDocument: 'after' },
    )

    return result ? this.mapSession(result) : null
  }

  async revokeSession(token: string) {
    const result = await this.sessions().updateOne(
      {
        tokenHash: hashToken(token),
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date().toISOString(),
        },
      },
    )

    return result.modifiedCount > 0
  }

  async getProfileSettings(userId: string) {
    const document = await this.profileSettings().findOne({ _id: userId })
    if (!document) {
      return clone(defaultProfileSettings)
    }

    return clone(document.settings)
  }

  async updateProfileSettings(userId: string, settings: ProfileSetting[]) {
    await this.profileSettings().updateOne(
      { _id: userId },
      {
        $set: {
          _id: userId,
          userId,
          settings: clone(settings),
        },
      },
      { upsert: true },
    )

    return this.getProfileSettings(userId)
  }

  async createOtpChallenge(challenge: OtpChallengeRecord) {
    await this.otpChallenges().updateOne(
      { _id: challenge.id },
      { $set: { _id: challenge.id, ...challenge } },
      { upsert: true },
    )

    return (await this.getOtpChallenge(challenge.id))!
  }

  async getOtpChallenge(id: string) {
    const document = await this.otpChallenges().findOne({ _id: id })
    return document ? this.mapWithoutId(document) : null
  }

  async updateOtpChallenge(challenge: OtpChallengeRecord) {
    await this.otpChallenges().updateOne(
      { _id: challenge.id },
      { $set: { _id: challenge.id, ...challenge } },
      { upsert: true },
    )

    return (await this.getOtpChallenge(challenge.id))!
  }

  async listNotifications(userId: string) {
    const documents = await this.notifications()
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return documents.map((document) => this.mapWithoutId(document))
  }

  async createNotification(notification: NotificationRecord) {
    await this.notifications().updateOne(
      { _id: notification.id },
      { $setOnInsert: { _id: notification.id, ...notification } },
      { upsert: true },
    )

    return notification
  }

  async listClaimTimeline(userId: string, claimId?: string) {
    const filter: Filter<ClaimTimelineDocument> = claimId
      ? { userId, claimId }
      : { userId }

    const documents = await this.claimTimeline()
      .find(filter)
      .sort({ createdAt: 1 })
      .toArray()

    return documents.map((document) => this.mapWithoutId(document))
  }

  async appendClaimTimeline(event: ClaimTimelineRecord) {
    await this.claimTimeline().updateOne(
      { _id: event.id },
      { $setOnInsert: { _id: event.id, ...event } },
      { upsert: true },
    )

    return event
  }

  async upsertPayoutRecord(record: PayoutRecord) {
    await this.payoutRecords().updateOne(
      { _id: record.reference },
      { $set: { _id: record.reference, ...record } },
      { upsert: true },
    )

    return (await this.getPayoutRecord(record.reference))!
  }

  async getPayoutRecord(reference: string) {
    const document = await this.payoutRecords().findOne({ _id: reference })
    return document ? this.mapWithoutId(document) : null
  }

  async listPayoutRecords(userId?: string) {
    const filter = userId ? { userId } : {}
    const documents = await this.payoutRecords()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return documents.map((document) => this.mapWithoutId(document))
  }

  async upsertSupportTicket(ticket: SupportTicketRecord) {
    await this.supportTickets().updateOne(
      { _id: ticket.ticketId },
      { $set: { _id: ticket.ticketId, ...ticket } },
      { upsert: true },
    )

    return (await this.getLatestSupportTicket(ticket.userId))!
  }

  async listSupportTickets(userId: string) {
    const documents = await this.supportTickets()
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return documents.map((document) => this.mapWithoutId(document))
  }

  async getLatestSupportTicket(userId: string) {
    const document = await this.supportTickets()
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .next()

    return document ? this.mapWithoutId(document) : null
  }

  async upsertFraudReview(review: FraudReviewRecord) {
    await this.fraudReviews().updateOne(
      { _id: review.id },
      { $set: { _id: review.id, ...review } },
      { upsert: true },
    )

    return (await this.getFraudReview(review.id))!
  }

  async getFraudReview(id: string) {
    const document = await this.fraudReviews().findOne({ _id: id })
    return document ? this.mapWithoutId(document) : null
  }

  async listFraudReviews() {
    const documents = await this.fraudReviews()
      .find({})
      .sort({ updatedAt: -1 })
      .toArray()

    return documents.map((document) => this.mapWithoutId(document))
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

    return this.upsertFraudReview({
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      resolutionNote: `Updated via ${action} action`,
    })
  }

  async getFeatureFlags() {
    const documents = await this.featureFlags()
      .find({})
      .sort({ key: 1 })
      .toArray()

    return documents.map((document) => this.mapWithoutId(document))
  }

  async upsertFeatureFlag(flag: FeatureFlagRecord) {
    await this.featureFlags().updateOne(
      { _id: flag.key },
      { $set: { _id: flag.key, ...flag } },
      { upsert: true },
    )

    const document = await this.featureFlags().findOne({ _id: flag.key })
    return document ? this.mapWithoutId(document) : null
  }

  private users() {
    return this.database.collection<UserDocument>('users')
  }

  private sessions() {
    return this.database.collection<SessionDocument>('sessions')
  }

  private profileSettings() {
    return this.database.collection<ProfileSettingsDocument>('profileSettings')
  }

  private otpChallenges() {
    return this.database.collection<OtpChallengeDocument>('otpChallenges')
  }

  private notifications() {
    return this.database.collection<NotificationDocument>('notifications')
  }

  private claimTimeline() {
    return this.database.collection<ClaimTimelineDocument>('claimTimeline')
  }

  private payoutRecords() {
    return this.database.collection<PayoutRecordDocument>('payoutRecords')
  }

  private supportTickets() {
    return this.database.collection<SupportTicketDocument>('supportTickets')
  }

  private fraudReviews() {
    return this.database.collection<FraudReviewDocument>('fraudReviews')
  }

  private featureFlags() {
    return this.database.collection<FeatureFlagDocument>('featureFlags')
  }

  private async ensureIndexes() {
    await Promise.all([
      this.users().createIndex({ phoneNormalized: 1 }, { unique: true }),
      this.users().createIndex(
        { emailLowercase: 1 },
        {
          unique: true,
          partialFilterExpression: {
            emailLowercase: { $type: 'string' },
          },
        },
      ),
      this.sessions().createIndex({ tokenHash: 1 }, { unique: true }),
      this.sessions().createIndex({ userId: 1 }),
      this.sessions().createIndex({ expiresAt: 1 }),
      this.profileSettings().createIndex({ userId: 1 }, { unique: true }),
      this.otpChallenges().createIndex({ phoneNormalized: 1, status: 1 }),
      this.notifications().createIndex({ userId: 1, createdAt: -1 }),
      this.claimTimeline().createIndex({ userId: 1, claimId: 1, createdAt: 1 }),
      this.payoutRecords().createIndex({ userId: 1, createdAt: -1 }),
      this.supportTickets().createIndex({ userId: 1, createdAt: -1 }),
      this.fraudReviews().createIndex({ updatedAt: -1 }),
    ])
  }

  private async purgeExpiredSessions() {
    await this.sessions().deleteMany({
      expiresAt: { $lte: new Date().toISOString() },
    })
  }

  private get database() {
    if (!this.db) {
      throw new Error('MongoStore has not been initialized.')
    }

    return this.db
  }

  private mapUser(document: WithId<UserDocument>): StoredUser {
    return {
      id: document.id,
      email: document.email ?? undefined,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      lastLoginAt: document.lastLoginAt,
      name: document.name,
      platform: document.platform,
      phone: document.phone,
      platforms: document.platforms,
      city: document.city,
      zone: document.zone,
      plan: document.plan,
      weeklyPremium: document.weeklyPremium,
      iwi: document.iwi,
      trustScore: document.trustScore,
      upi: document.upi,
      kycVerified: document.kycVerified,
      nextDeduction: document.nextDeduction,
      role: document.role,
    }
  }

  private mapSession(document: WithId<SessionDocument>): SessionRecord {
    return {
      id: document.id,
      userId: document.userId,
      createdAt: document.createdAt,
      lastSeenAt: document.lastSeenAt,
      expiresAt: document.expiresAt,
      revokedAt: document.revokedAt,
    }
  }

  private mapWithoutId<T extends { _id: string }>(document: WithId<T>): Omit<T, '_id'> {
    const { _id, ...rest } = document
    void _id
    return rest as Omit<T, '_id'>
  }
}

function toUserDocument(user: StoredUser): UserDocument {
  return {
    _id: user.id,
    ...user,
    email: normalizeEmail(user.email) ?? undefined,
    phoneNormalized: normalizePhone(user.phone),
    emailLowercase: normalizeEmail(user.email),
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function normalizeEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase()
  return normalized ? normalized : null
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

function clone<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T
}
