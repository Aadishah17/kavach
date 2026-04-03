import type { PlanName, ProfileSetting, WorkerProfile } from '../packages/shared/src/types.js'

export type { PlanName, ProfileSetting, WorkerProfile }

export type BaseWorkerProfile = Omit<WorkerProfile, 'id'>

export type StoredUser = BaseWorkerProfile & {
  id: string
  email?: string
  status: 'active'
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type SessionRecord = {
  id: string
  userId: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  revokedAt: string | null
}

export type SignupInput = import('../packages/shared/src/types.js').SignupPayload

export type AuthContext = {
  user: StoredUser
  session: SessionRecord
  token: string
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext
  }
}
