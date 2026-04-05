import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Firestore } from '@google-cloud/firestore'
import type { ProfileSetting, SessionRecord, StoredUser } from './types.js'
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

  async upsertUser(user: StoredUser): Promise<StoredUser> {
    const docRef = this.db.collection('users').doc(user.id)
    const data = {
      ...user,
      phoneNormalized: normalizePhone(user.phone),
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
