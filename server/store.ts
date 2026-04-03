import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ProfileSetting, SessionRecord, StoredUser } from './types.js'
import { buildDemoUser, defaultProfileSettings } from './seed.js'

type LegacySessionRecord = {
  token: string
  userId: string
  createdAt: string
  lastSeenAt: string
  revokedAt: string | null
}

type LegacyDatabase = {
  users: StoredUser[]
  sessions?: LegacySessionRecord[]
  profileSettingsByUser?: Record<string, ProfileSetting[]>
}

type UserRow = {
  id: string
  email: string | null
  status: 'active'
  created_at: string
  updated_at: string
  last_login_at: string | null
  name: string
  platform: string
  phone: string
  phone_normalized: string
  platforms_json: string
  city: string
  zone: string
  plan: string
  weekly_premium: number
  iwi: number
  trust_score: number
  upi: string
  kyc_verified: number
  next_deduction: string
  role: 'worker' | 'admin'
}

type SessionRow = {
  id: string
  user_id: string
  created_at: string
  last_seen_at: string
  expires_at: string
  revoked_at: string | null
}

const SESSION_TTL_DAYS = 30

export class SqliteStore {
  private readonly dbPath: string
  private readonly legacyJsonPath: string | null
  private db: DatabaseSync | null = null

  constructor(dbPath: string, options?: { legacyJsonPath?: string | null }) {
    this.dbPath = dbPath
    this.legacyJsonPath = options?.legacyJsonPath ?? null
  }

  async init() {
    await mkdir(path.dirname(this.dbPath), { recursive: true })
    this.db = new DatabaseSync(this.dbPath)
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT,
        name TEXT NOT NULL,
        platform TEXT NOT NULL,
        phone TEXT NOT NULL,
        phone_normalized TEXT NOT NULL UNIQUE,
        platforms_json TEXT NOT NULL,
        city TEXT NOT NULL,
        zone TEXT NOT NULL,
        plan TEXT NOT NULL,
        weekly_premium INTEGER NOT NULL,
        iwi INTEGER NOT NULL,
        trust_score INTEGER NOT NULL,
        upi TEXT NOT NULL,
        kyc_verified INTEGER NOT NULL,
        next_deduction TEXT NOT NULL,
        role TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS profile_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        label TEXT NOT NULL,
        value TEXT NOT NULL,
        enabled INTEGER NOT NULL,
        kind TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_profile_settings_user_sort ON profile_settings(user_id, sort_order);
    `)

    await this.importLegacyJsonIfNeeded()
    await this.ensureDemoUser()
    this.purgeExpiredSessions()
  }

  close() {
    this.db?.close()
    this.db = null
  }

  async getUserById(userId: string) {
    const row = this.database.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined
    return row ? this.mapUserRow(row) : null
  }

  async getUserByPhone(phone: string) {
    const row = this.database
      .prepare('SELECT * FROM users WHERE phone_normalized = ?')
      .get(normalizePhone(phone)) as UserRow | undefined

    return row ? this.mapUserRow(row) : null
  }

  async upsertUser(user: StoredUser) {
    this.database.prepare(`
      INSERT INTO users (
        id, email, status, created_at, updated_at, last_login_at, name, platform, phone,
        phone_normalized, platforms_json, city, zone, plan, weekly_premium, iwi, trust_score,
        upi, kyc_verified, next_deduction, role
      ) VALUES (
        @id, @email, @status, @createdAt, @updatedAt, @lastLoginAt, @name, @platform, @phone,
        @phoneNormalized, @platformsJson, @city, @zone, @plan, @weeklyPremium, @iwi, @trustScore,
        @upi, @kycVerified, @nextDeduction, @role
      )
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        status = excluded.status,
        updated_at = excluded.updated_at,
        last_login_at = excluded.last_login_at,
        name = excluded.name,
        platform = excluded.platform,
        phone = excluded.phone,
        phone_normalized = excluded.phone_normalized,
        platforms_json = excluded.platforms_json,
        city = excluded.city,
        zone = excluded.zone,
        plan = excluded.plan,
        weekly_premium = excluded.weekly_premium,
        iwi = excluded.iwi,
        trust_score = excluded.trust_score,
        upi = excluded.upi,
        kyc_verified = excluded.kyc_verified,
        next_deduction = excluded.next_deduction,
        role = excluded.role
    `).run({
      id: user.id,
      email: user.email ?? null,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      name: user.name,
      platform: user.platform,
      phone: user.phone,
      phoneNormalized: normalizePhone(user.phone),
      platformsJson: JSON.stringify(user.platforms),
      city: user.city,
      zone: user.zone,
      plan: user.plan,
      weeklyPremium: user.weeklyPremium,
      iwi: user.iwi,
      trustScore: user.trustScore,
      upi: user.upi,
      kycVerified: user.kycVerified ? 1 : 0,
      nextDeduction: user.nextDeduction,
      role: user.role,
    })

    if (!this.hasStoredProfileSettings(user.id)) {
      await this.updateProfileSettings(user.id, defaultProfileSettings)
    }

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

    this.database.prepare(`
      INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, revoked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.userId,
      hashToken(token),
      session.createdAt,
      session.lastSeenAt,
      session.expiresAt,
      session.revokedAt,
    )

    this.database.prepare(`
      UPDATE users
      SET last_login_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, userId)

    return {
      token,
      session,
    }
  }

  async getSession(token: string) {
    const row = this.database.prepare(`
      SELECT id, user_id, created_at, last_seen_at, expires_at, revoked_at
      FROM sessions
      WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
    `).get(hashToken(token), new Date().toISOString()) as SessionRow | undefined

    return row ? this.mapSessionRow(row) : null
  }

  async touchSession(token: string) {
    const now = new Date().toISOString()
    const expiresAt = addDays(now, SESSION_TTL_DAYS)
    const result = this.database.prepare(`
      UPDATE sessions
      SET last_seen_at = ?, expires_at = ?
      WHERE token_hash = ? AND revoked_at IS NULL
    `).run(now, expiresAt, hashToken(token))

    if (result.changes === 0) {
      return null
    }

    return this.getSession(token)
  }

  async revokeSession(token: string) {
    const result = this.database.prepare(`
      UPDATE sessions
      SET revoked_at = ?
      WHERE token_hash = ? AND revoked_at IS NULL
    `).run(new Date().toISOString(), hashToken(token))

    return result.changes > 0
  }

  async getProfileSettings(userId: string) {
    const rows = this.database.prepare(`
      SELECT label, value, enabled, kind
      FROM profile_settings
      WHERE user_id = ?
      ORDER BY sort_order ASC
    `).all(userId) as Array<{
      label: string
      value: string
      enabled: number
      kind: 'link' | null
    }>

    if (rows.length === 0) {
      return this.clone(defaultProfileSettings)
    }

    return rows.map((row) => ({
      label: row.label,
      value: row.value,
      enabled: Boolean(row.enabled),
      kind: row.kind ?? undefined,
    }))
  }

  async updateProfileSettings(userId: string, settings: ProfileSetting[]) {
    this.database.exec('BEGIN IMMEDIATE')

    try {
      this.database.prepare('DELETE FROM profile_settings WHERE user_id = ?').run(userId)
      const insertSetting = this.database.prepare(`
        INSERT INTO profile_settings (user_id, sort_order, label, value, enabled, kind)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      settings.forEach((setting, index) => {
        insertSetting.run(
          userId,
          index,
          setting.label,
          setting.value,
          setting.enabled ? 1 : 0,
          setting.kind ?? null,
        )
      })

      this.database.exec('COMMIT')
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }

    return this.getProfileSettings(userId)
  }

  private async importLegacyJsonIfNeeded() {
    if (!this.legacyJsonPath || !existsSync(this.legacyJsonPath)) {
      return
    }

    const existingUsers = Number(
      (this.database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count,
    )

    if (existingUsers > 0) {
      return
    }

    const payload = JSON.parse(await readFile(this.legacyJsonPath, 'utf8')) as LegacyDatabase

    for (const user of payload.users ?? []) {
      await this.upsertUser(user)
    }

    for (const [userId, settings] of Object.entries(payload.profileSettingsByUser ?? {})) {
      await this.updateProfileSettings(userId, settings)
    }

    const insertSession = this.database.prepare(`
      INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, revoked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    for (const session of payload.sessions ?? []) {
      insertSession.run(
        randomUUID(),
        session.userId,
        hashToken(session.token),
        session.createdAt,
        session.lastSeenAt,
        addDays(session.lastSeenAt, SESSION_TTL_DAYS),
        session.revokedAt,
      )
    }
  }

  private async ensureDemoUser() {
    const existingDemoUser = await this.getUserById('user-demo')
    if (!existingDemoUser) {
      await this.upsertUser(buildDemoUser())
      return
    }

    if (!this.hasStoredProfileSettings(existingDemoUser.id)) {
      await this.updateProfileSettings(existingDemoUser.id, defaultProfileSettings)
    }
  }

  private purgeExpiredSessions() {
    this.database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString())
  }

  private mapUserRow(row: UserRow): StoredUser {
    return {
      id: row.id,
      email: row.email ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
      name: row.name,
      platform: row.platform,
      phone: row.phone,
      platforms: JSON.parse(row.platforms_json) as string[],
      city: row.city,
      zone: row.zone,
      plan: row.plan,
      weeklyPremium: row.weekly_premium,
      iwi: row.iwi,
      trustScore: row.trust_score,
      upi: row.upi,
      kycVerified: Boolean(row.kyc_verified),
      nextDeduction: row.next_deduction,
      role: row.role,
    }
  }

  private mapSessionRow(row: SessionRow): SessionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    }
  }

  private clone<T>(value: T) {
    return JSON.parse(JSON.stringify(value)) as T
  }

  private hasStoredProfileSettings(userId: string) {
    const row = this.database.prepare(`
      SELECT COUNT(*) AS count
      FROM profile_settings
      WHERE user_id = ?
    `).get(userId) as { count: number }

    return Number(row.count) > 0
  }

  private get database() {
    if (!this.db) {
      throw new Error('SqliteStore has not been initialized.')
    }

    return this.db
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
