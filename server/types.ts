import type {
  FraudReviewAction,
  FraudReviewStatus,
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
  OtpPurpose,
  PaymentProvider,
  PlanName,
  ProfileSetting,
  PayoutStatus,
  SupportTicketStatus,
  TimelineEventStatus,
  WorkerProfile,
} from '../packages/shared/src/types.js'

export type {
  FraudReviewAction,
  FraudReviewStatus,
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
  OtpPurpose,
  PaymentProvider,
  PlanName,
  ProfileSetting,
  PayoutStatus,
  SupportTicketStatus,
  TimelineEventStatus,
  WorkerProfile,
}

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

export type OtpChallengeRecord = {
  id: string
  phone: string
  phoneNormalized: string
  purpose: OtpPurpose
  code: string
  signupPayload: SignupInput | null
  createdAt: string
  expiresAt: string
  attempts: number
  maxAttempts: number
  status: 'pending' | 'verified' | 'expired'
  verifiedAt: string | null
}

export type NotificationRecord = {
  id: string
  userId: string
  title: string
  body: string
  kind: NotificationKind
  channel: NotificationChannel
  status: NotificationStatus
  createdAt: string
  readAt: string | null
  actionLabel: string | null
  actionHref: string | null
}

export type ClaimTimelineRecord = {
  id: string
  claimId: string
  userId: string
  title: string
  description: string
  status: TimelineEventStatus
  createdAt: string
}

export type PayoutRecord = {
  reference: string
  claimId: string
  userId: string
  amount: number
  status: PayoutStatus
  provider: PaymentProvider
  rail: string
  etaMinutes: number
  updatedAt: string
  createdAt: string
  triggerTitle: string
  zone: string
}

export type SupportTicketRecord = {
  ticketId: string
  userId: string
  status: SupportTicketStatus
  channel: 'callback' | 'chat' | 'phone'
  callbackEtaMinutes: number
  hotline: string
  message: string
  createdAt: string
  updatedAt: string
}

export type FraudReviewRecord = {
  id: string
  userId: string
  workerName: string
  zone: string
  riskLabel: 'clear' | 'watch' | 'review'
  score: number
  reason: string
  status: FraudReviewStatus
  createdAt: string
  updatedAt: string
  resolutionNote: string | null
}

export type FeatureFlagRecord = {
  key: string
  label: string
  description: string
  enabled: boolean
  updatedAt: string
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
