export type Role = 'worker' | 'admin'

export type PlanName = 'Basic' | 'Standard' | 'Pro'
export type ProfileSetting = {
  label: string
  value: string
  enabled: boolean
  kind?: 'link'
}

export type WorkerProfile = {
  name: string
  platform: string
  phone: string
  platforms: string[]
  city: string
  zone: string
  plan: string
  weeklyPremium: number
  iwi: number
  trustScore: number
  upi: string
  kycVerified: boolean
  nextDeduction: string
  role: Role
}

export type StoredUser = WorkerProfile & {
  id: string
  email?: string
  status: 'active'
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type SessionRecord = {
  token: string
  userId: string
  createdAt: string
  lastSeenAt: string
  revokedAt: string | null
}

export type Database = {
  users: StoredUser[]
  sessions: SessionRecord[]
  profileSettingsByUser: Record<string, ProfileSetting[]>
}

export type SignupInput = {
  name: string
  phone: string
  platforms: string[]
  city: string
  zone: string
  plan: PlanName
  upi: string
}

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
