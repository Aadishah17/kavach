import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Database, ProfileSetting, SessionRecord, StoredUser } from './types.js'
import { buildDemoUser, createInitialDatabase, defaultProfileSettings } from './seed.js'

export class JsonStore {
  private readonly dbPath: string
  private state: Database | null = null
  private writeChain: Promise<void> = Promise.resolve()

  constructor(dbPath: string) {
    this.dbPath = dbPath
  }

  async init() {
    await mkdir(path.dirname(this.dbPath), { recursive: true })

    try {
      const raw = await readFile(this.dbPath, 'utf8')
      this.state = JSON.parse(raw) as Database
    } catch {
      this.state = createInitialDatabase()
      await this.persist()
    }

    if (!this.state.profileSettingsByUser) {
      this.state.profileSettingsByUser = {}
    }

    if (!this.state.users.some((user) => user.id === 'user-demo')) {
      this.state.users.unshift(buildDemoUser())
      await this.persist()
    }

    if (!this.state.profileSettingsByUser['user-demo']) {
      this.state.profileSettingsByUser['user-demo'] = this.clone(defaultProfileSettings)
      await this.persist()
    }
  }

  async getDatabase() {
    await this.ensureReady()
    return this.clone(this.state!)
  }

  async getUserById(userId: string) {
    await this.ensureReady()
    return this.state!.users.find((user) => user.id === userId) ?? null
  }

  async getUserByPhone(phone: string) {
    await this.ensureReady()
    return this.state!.users.find((user) => normalizePhone(user.phone) === normalizePhone(phone)) ?? null
  }

  async upsertUser(user: StoredUser) {
    await this.ensureReady()

    const existingIndex = this.state!.users.findIndex((item) => item.id === user.id)
    if (existingIndex >= 0) {
      this.state!.users[existingIndex] = user
    } else {
      this.state!.users.unshift(user)
    }

    if (!this.state!.profileSettingsByUser[user.id]) {
      this.state!.profileSettingsByUser[user.id] = this.clone(defaultProfileSettings)
    }

    await this.persist()
    return user
  }

  async createSession(userId: string) {
    await this.ensureReady()

    const session: SessionRecord = {
      token: randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      revokedAt: null,
    }

    this.state!.sessions.unshift(session)
    await this.persist()
    return session
  }

  async getProfileSettings(userId: string) {
    await this.ensureReady()
    return this.clone(this.state!.profileSettingsByUser[userId] ?? defaultProfileSettings)
  }

  async updateProfileSettings(userId: string, settings: ProfileSetting[]) {
    await this.ensureReady()
    this.state!.profileSettingsByUser[userId] = this.clone(settings)
    await this.persist()
    return this.clone(this.state!.profileSettingsByUser[userId])
  }

  async getSession(token: string) {
    await this.ensureReady()
    return this.state!.sessions.find((session) => session.token === token && !session.revokedAt) ?? null
  }

  async touchSession(token: string) {
    await this.ensureReady()
    const session = this.state!.sessions.find((item) => item.token === token)
    if (!session || session.revokedAt) {
      return null
    }

    session.lastSeenAt = new Date().toISOString()
    await this.persist()
    return session
  }

  async revokeSession(token: string) {
    await this.ensureReady()
    const session = this.state!.sessions.find((item) => item.token === token)

    if (!session) {
      return false
    }

    session.revokedAt = new Date().toISOString()
    await this.persist()
    return true
  }

  private async ensureReady() {
    if (this.state) {
      return
    }

    await this.init()
  }

  private async persist() {
    if (!this.state) {
      return
    }

    const payload = JSON.stringify(this.state, null, 2)
    this.writeChain = this.writeChain.then(async () => {
      const tempPath = `${this.dbPath}.tmp`
      await writeFile(tempPath, payload, 'utf8')
      await rename(tempPath, this.dbPath)
    })

    await this.writeChain
  }

  private clone<T>(value: T) {
    return JSON.parse(JSON.stringify(value)) as T
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}
