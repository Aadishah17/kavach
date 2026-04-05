import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
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

type OtpChallengeRow = {
  id: string
  phone: string
  phone_normalized: string
  purpose: 'login' | 'signup'
  code: string
  signup_payload_json: string | null
  created_at: string
  expires_at: string
  attempts: number
  max_attempts: number
  status: 'pending' | 'verified' | 'expired'
  verified_at: string | null
}

type NotificationRow = {
  id: string
  user_id: string
  title: string
  body: string
  kind: string
  channel: string
  status: string
  created_at: string
  read_at: string | null
  action_label: string | null
  action_href: string | null
}

type ClaimTimelineRow = {
  id: string
  claim_id: string
  user_id: string
  title: string
  description: string
  status: string
  created_at: string
}

type PayoutRecordRow = {
  reference: string
  claim_id: string
  user_id: string
  amount: number
  status: string
  provider: string
  rail: string
  eta_minutes: number
  updated_at: string
  created_at: string
  trigger_title: string
  zone: string
}

type SupportTicketRow = {
  ticket_id: string
  user_id: string
  status: string
  channel: 'callback' | 'chat' | 'phone'
  callback_eta_minutes: number
  hotline: string
  message: string
  created_at: string
  updated_at: string
}

type FraudReviewRow = {
  id: string
  user_id: string
  worker_name: string
  zone: string
  risk_label: 'clear' | 'watch' | 'review'
  score: number
  reason: string
  status: string
  created_at: string
  updated_at: string
  resolution_note: string | null
}

type FeatureFlagRow = {
  key: string
  label: string
  description: string
  enabled: number
  updated_at: string
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

      CREATE TABLE IF NOT EXISTS otp_challenges (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        phone_normalized TEXT NOT NULL,
        purpose TEXT NOT NULL,
        code TEXT NOT NULL,
        signup_payload_json TEXT,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        attempts INTEGER NOT NULL,
        max_attempts INTEGER NOT NULL,
        status TEXT NOT NULL,
        verified_at TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        kind TEXT NOT NULL,
        channel TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        read_at TEXT,
        action_label TEXT,
        action_href TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS claim_timeline (
        id TEXT PRIMARY KEY,
        claim_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payout_records (
        reference TEXT PRIMARY KEY,
        claim_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        provider TEXT NOT NULL,
        rail TEXT NOT NULL,
        eta_minutes INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        trigger_title TEXT NOT NULL,
        zone TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        channel TEXT NOT NULL,
        callback_eta_minutes INTEGER NOT NULL,
        hotline TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS fraud_reviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        worker_name TEXT NOT NULL,
        zone TEXT NOT NULL,
        risk_label TEXT NOT NULL,
        score INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolution_note TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS feature_flags (
        key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        description TEXT NOT NULL,
        enabled INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_profile_settings_user_sort ON profile_settings(user_id, sort_order);
      CREATE INDEX IF NOT EXISTS idx_otp_phone_status ON otp_challenges(phone_normalized, status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_claim_timeline_user_claim ON claim_timeline(user_id, claim_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_payout_records_user_created ON payout_records(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created ON support_tickets(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_fraud_reviews_status ON fraud_reviews(status, updated_at DESC);
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

  async createOtpChallenge(challenge: OtpChallengeRecord) {
    this.database.prepare(`
      INSERT INTO otp_challenges (
        id, phone, phone_normalized, purpose, code, signup_payload_json, created_at,
        expires_at, attempts, max_attempts, status, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      challenge.id,
      challenge.phone,
      challenge.phoneNormalized,
      challenge.purpose,
      challenge.code,
      challenge.signupPayload ? JSON.stringify(challenge.signupPayload) : null,
      challenge.createdAt,
      challenge.expiresAt,
      challenge.attempts,
      challenge.maxAttempts,
      challenge.status,
      challenge.verifiedAt,
    )

    return (await this.getOtpChallenge(challenge.id))!
  }

  async getOtpChallenge(id: string) {
    const row = this.database.prepare(`
      SELECT * FROM otp_challenges WHERE id = ?
    `).get(id) as OtpChallengeRow | undefined

    return row ? this.mapOtpChallengeRow(row) : null
  }

  async updateOtpChallenge(challenge: OtpChallengeRecord) {
    this.database.prepare(`
      UPDATE otp_challenges
      SET phone = ?, phone_normalized = ?, purpose = ?, code = ?, signup_payload_json = ?, created_at = ?,
        expires_at = ?, attempts = ?, max_attempts = ?, status = ?, verified_at = ?
      WHERE id = ?
    `).run(
      challenge.phone,
      challenge.phoneNormalized,
      challenge.purpose,
      challenge.code,
      challenge.signupPayload ? JSON.stringify(challenge.signupPayload) : null,
      challenge.createdAt,
      challenge.expiresAt,
      challenge.attempts,
      challenge.maxAttempts,
      challenge.status,
      challenge.verifiedAt,
      challenge.id,
    )

    return (await this.getOtpChallenge(challenge.id))!
  }

  async listNotifications(userId: string) {
    const rows = this.database.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as NotificationRow[]

    return rows.map((row) => this.mapNotificationRow(row))
  }

  async createNotification(notification: NotificationRecord) {
    this.database.prepare(`
      INSERT INTO notifications (
        id, user_id, title, body, kind, channel, status, created_at, read_at, action_label, action_href
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      notification.id,
      notification.userId,
      notification.title,
      notification.body,
      notification.kind,
      notification.channel,
      notification.status,
      notification.createdAt,
      notification.readAt,
      notification.actionLabel,
      notification.actionHref,
    )

    return notification
  }

  async listClaimTimeline(userId: string, claimId?: string) {
    const rows = claimId
      ? this.database.prepare(`
        SELECT * FROM claim_timeline
        WHERE user_id = ? AND claim_id = ?
        ORDER BY created_at ASC
      `).all(userId, claimId) as ClaimTimelineRow[]
      : this.database.prepare(`
        SELECT * FROM claim_timeline
        WHERE user_id = ?
        ORDER BY created_at ASC
      `).all(userId) as ClaimTimelineRow[]

    return rows.map((row) => this.mapClaimTimelineRow(row))
  }

  async appendClaimTimeline(event: ClaimTimelineRecord) {
    this.database.prepare(`
      INSERT INTO claim_timeline (id, claim_id, user_id, title, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.claimId,
      event.userId,
      event.title,
      event.description,
      event.status,
      event.createdAt,
    )

    return event
  }

  async upsertPayoutRecord(record: PayoutRecord) {
    this.database.prepare(`
      INSERT INTO payout_records (
        reference, claim_id, user_id, amount, status, provider, rail, eta_minutes,
        updated_at, created_at, trigger_title, zone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(reference) DO UPDATE SET
        claim_id = excluded.claim_id,
        amount = excluded.amount,
        status = excluded.status,
        provider = excluded.provider,
        rail = excluded.rail,
        eta_minutes = excluded.eta_minutes,
        updated_at = excluded.updated_at,
        trigger_title = excluded.trigger_title,
        zone = excluded.zone
    `).run(
      record.reference,
      record.claimId,
      record.userId,
      record.amount,
      record.status,
      record.provider,
      record.rail,
      record.etaMinutes,
      record.updatedAt,
      record.createdAt,
      record.triggerTitle,
      record.zone,
    )

    return (await this.getPayoutRecord(record.reference))!
  }

  async getPayoutRecord(reference: string) {
    const row = this.database.prepare(`
      SELECT * FROM payout_records WHERE reference = ?
    `).get(reference) as PayoutRecordRow | undefined

    return row ? this.mapPayoutRecordRow(row) : null
  }

  async listPayoutRecords(userId?: string) {
    const rows = userId
      ? this.database.prepare(`
        SELECT * FROM payout_records WHERE user_id = ? ORDER BY created_at DESC
      `).all(userId) as PayoutRecordRow[]
      : this.database.prepare(`
        SELECT * FROM payout_records ORDER BY created_at DESC
      `).all() as PayoutRecordRow[]

    return rows.map((row) => this.mapPayoutRecordRow(row))
  }

  async upsertSupportTicket(ticket: SupportTicketRecord) {
    this.database.prepare(`
      INSERT INTO support_tickets (
        ticket_id, user_id, status, channel, callback_eta_minutes, hotline, message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ticket_id) DO UPDATE SET
        status = excluded.status,
        channel = excluded.channel,
        callback_eta_minutes = excluded.callback_eta_minutes,
        hotline = excluded.hotline,
        message = excluded.message,
        updated_at = excluded.updated_at
    `).run(
      ticket.ticketId,
      ticket.userId,
      ticket.status,
      ticket.channel,
      ticket.callbackEtaMinutes,
      ticket.hotline,
      ticket.message,
      ticket.createdAt,
      ticket.updatedAt,
    )

    return (await this.getLatestSupportTicket(ticket.userId))!
  }

  async listSupportTickets(userId: string) {
    const rows = this.database.prepare(`
      SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as SupportTicketRow[]

    return rows.map((row) => this.mapSupportTicketRow(row))
  }

  async getLatestSupportTicket(userId: string) {
    const row = this.database.prepare(`
      SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(userId) as SupportTicketRow | undefined

    return row ? this.mapSupportTicketRow(row) : null
  }

  async upsertFraudReview(review: FraudReviewRecord) {
    this.database.prepare(`
      INSERT INTO fraud_reviews (
        id, user_id, worker_name, zone, risk_label, score, reason, status, created_at, updated_at, resolution_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        risk_label = excluded.risk_label,
        score = excluded.score,
        reason = excluded.reason,
        status = excluded.status,
        updated_at = excluded.updated_at,
        resolution_note = excluded.resolution_note
    `).run(
      review.id,
      review.userId,
      review.workerName,
      review.zone,
      review.riskLabel,
      review.score,
      review.reason,
      review.status,
      review.createdAt,
      review.updatedAt,
      review.resolutionNote,
    )

    return (await this.getFraudReview(review.id))!
  }

  async getFraudReview(id: string) {
    const row = this.database.prepare(`
      SELECT * FROM fraud_reviews WHERE id = ?
    `).get(id) as FraudReviewRow | undefined

    return row ? this.mapFraudReviewRow(row) : null
  }

  async listFraudReviews() {
    const rows = this.database.prepare(`
      SELECT * FROM fraud_reviews ORDER BY updated_at DESC
    `).all() as FraudReviewRow[]

    return rows.map((row) => this.mapFraudReviewRow(row))
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
    const rows = this.database.prepare(`
      SELECT * FROM feature_flags ORDER BY key ASC
    `).all() as FeatureFlagRow[]

    return rows.map((row) => this.mapFeatureFlagRow(row))
  }

  async upsertFeatureFlag(flag: FeatureFlagRecord) {
    this.database.prepare(`
      INSERT INTO feature_flags (key, label, description, enabled, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        label = excluded.label,
        description = excluded.description,
        enabled = excluded.enabled,
        updated_at = excluded.updated_at
    `).run(
      flag.key,
      flag.label,
      flag.description,
      flag.enabled ? 1 : 0,
      flag.updatedAt,
    )

    const flags = await this.getFeatureFlags()
    return flags.find((item) => item.key === flag.key) ?? null
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

  private mapOtpChallengeRow(row: OtpChallengeRow): OtpChallengeRecord {
    return {
      id: row.id,
      phone: row.phone,
      phoneNormalized: row.phone_normalized,
      purpose: row.purpose,
      code: row.code,
      signupPayload: row.signup_payload_json ? JSON.parse(row.signup_payload_json) : null,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      status: row.status,
      verifiedAt: row.verified_at,
    }
  }

  private mapNotificationRow(row: NotificationRow): NotificationRecord {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      body: row.body,
      kind: row.kind as NotificationRecord['kind'],
      channel: row.channel as NotificationRecord['channel'],
      status: row.status as NotificationRecord['status'],
      createdAt: row.created_at,
      readAt: row.read_at,
      actionLabel: row.action_label,
      actionHref: row.action_href,
    }
  }

  private mapClaimTimelineRow(row: ClaimTimelineRow): ClaimTimelineRecord {
    return {
      id: row.id,
      claimId: row.claim_id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      status: row.status as ClaimTimelineRecord['status'],
      createdAt: row.created_at,
    }
  }

  private mapPayoutRecordRow(row: PayoutRecordRow): PayoutRecord {
    return {
      reference: row.reference,
      claimId: row.claim_id,
      userId: row.user_id,
      amount: row.amount,
      status: row.status as PayoutRecord['status'],
      provider: row.provider as PayoutRecord['provider'],
      rail: row.rail,
      etaMinutes: row.eta_minutes,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      triggerTitle: row.trigger_title,
      zone: row.zone,
    }
  }

  private mapSupportTicketRow(row: SupportTicketRow): SupportTicketRecord {
    return {
      ticketId: row.ticket_id,
      userId: row.user_id,
      status: row.status as SupportTicketRecord['status'],
      channel: row.channel,
      callbackEtaMinutes: row.callback_eta_minutes,
      hotline: row.hotline,
      message: row.message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapFraudReviewRow(row: FraudReviewRow): FraudReviewRecord {
    return {
      id: row.id,
      userId: row.user_id,
      workerName: row.worker_name,
      zone: row.zone,
      riskLabel: row.risk_label,
      score: row.score,
      reason: row.reason,
      status: row.status as FraudReviewRecord['status'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolutionNote: row.resolution_note,
    }
  }

  private mapFeatureFlagRow(row: FeatureFlagRow): FeatureFlagRecord {
    return {
      key: row.key,
      label: row.label,
      description: row.description,
      enabled: Boolean(row.enabled),
      updatedAt: row.updated_at,
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
