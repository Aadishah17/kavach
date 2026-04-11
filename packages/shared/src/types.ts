export type CoverageStatus = 'paid' | 'pending' | 'flagged' | 'active' | 'safe' | 'alert'
export type WorkerRole = 'worker' | 'admin'
export type PlanName = 'Basic' | 'Standard' | 'Pro'
export type KpiAccent = 'green' | 'sky' | 'gold' | 'navy'
export type RiskLevel = 'low' | 'moderate' | 'high'
export type FraudStatus = 'clear' | 'watch' | 'review'
export type TriggerSource = 'public' | 'mock'
export type TriggerStatus = 'clear' | 'watch' | 'triggered'
export type PayoutStatus = 'monitoring' | 'triggered' | 'processing' | 'paid' | 'manual_review' | 'failed'
export type PaymentProvider = 'upi_mock' | 'razorpay_test' | 'stripe_test'
export type OtpPurpose = 'login' | 'signup'
export type OtpDelivery = 'mock' | 'sms' | 'whatsapp'
export type NotificationChannel = 'in_app' | 'email' | 'whatsapp'
export type NotificationKind = 'trigger' | 'payout' | 'support' | 'policy' | 'autopay' | 'security'
export type NotificationStatus = 'sent' | 'queued'
export type TimelineEventStatus = 'info' | 'watch' | 'success' | 'warning' | 'critical'
export type SupportTicketStatus = 'queued' | 'in_progress' | 'resolved'
export type FraudReviewStatus = 'open' | 'approved' | 'rejected' | 'escalated' | 'resolved'
export type FraudReviewAction = 'approve' | 'reject' | 'escalate' | 'resolve'

export type WorkerProfile = {
  id: string
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
  role: WorkerRole
}

export type PayoutRow = {
  date: string
  type: string
  disruption: string
  zone: string
  amount: number
  status: 'Paid' | 'Pending' | 'Flagged'
}

export type AlertItem = {
  icon: string
  title: string
  description: string
  badge: string
  tone: 'red' | 'gold' | 'sky' | 'green'
}

export type KpiCardData = {
  label: string
  value: string
  hint: string
  accent: KpiAccent
  inverse?: boolean
}

export type ActiveAlert = {
  type: string
  emoji: string
  zone: string
  condition: string
  payoutAmount: number
  triggeredAt: string
  paidAt: string
  coverage: number
}

export type DashboardAlert = {
  emoji: string
  title: string
  subtitle: string
  status: string
  tone: string
}

export type PremiumHistoryItem = {
  cycle: string
  paidOn: string
  amount: number
  note: string
}

export type PolicyCoverageItem = {
  title: string
  description: string
  badge: string
}

export type TriggerCardData = {
  emoji: string
  name: string
  condition: string
  coverage: number
}

export type AlertsFeedItem = {
  id?: string
  category: string
  title: string
  description: string
  status: string
  createdAt?: string
}

export type EmergencyResource = {
  title: string
  description: string
  cta: string
}

export type SupportContact = {
  initials: string
  name: string
  relation: string
  phone: string
}

export type ProfileDocument = {
  name: string
  meta: string
  status: string
}

export type ProfileSetting = {
  label: string
  value: string
  enabled: boolean
  kind?: 'link'
}

export type ZonePoint = {
  name: string
  top: string
  left: string
  tone: string
  risk: string
}

export type ZoneMapData = {
  cityLabel: string
  activeWatch: string
  zones: ZonePoint[]
}

export type RiskOutlook = {
  level: RiskLevel
  summary: string
  nextLikelyTrigger: string
  premiumDelta: number
  protectedAmount: number
  coverageHours: number
  confidence: number
}

export type FraudSignal = {
  label: string
  score: number
  status: FraudStatus
  reason: string
}

export type FraudAssessment = {
  score: number
  status: FraudStatus
  summary: string
  signals: FraudSignal[]
}

export type TriggerEvaluation = {
  id: string
  name: string
  source: TriggerSource
  status: TriggerStatus
  detail: string
  probability: number
}

export type DashboardQuickAction = {
  id: string
  label: string
  description: string
  action: 'support' | 'receipt' | 'autopay' | 'upgrade' | 'payout'
  tone: 'primary' | 'secondary' | 'ghost'
}

export type PayoutState = {
  reference: string
  amount: number
  status: PayoutStatus
  provider: PaymentProvider
  rail: string
  etaMinutes: number
  updatedAt: string
}

export type OtpChallenge = {
  challengeId: string
  phone: string
  purpose: OtpPurpose
  expiresAt: string
  resendAfterSeconds: number
  delivery: OtpDelivery
  maskedDestination: string
  demoCode?: string
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  kind: NotificationKind
  channel: NotificationChannel
  status: NotificationStatus
  createdAt: string
  readAt: string | null
  actionLabel?: string
  actionHref?: string
}

export type ClaimTimelineEntry = {
  id: string
  claimId: string
  title: string
  description: string
  status: TimelineEventStatus
  createdAt: string
}

export type SupportTicketSummary = {
  ticketId: string
  status: SupportTicketStatus
  channel: 'callback' | 'chat' | 'phone'
  callbackEtaMinutes: number
  hotline: string
  createdAt: string
  updatedAt: string
  message: string
}

export type ReceiptSummary = {
  reference: string
  downloadPath: string
  shareLabel: string
}

export type PayoutOpsItem = {
  reference: string
  workerName: string
  zone: string
  amount: number
  provider: PaymentProvider
  status: PayoutStatus
  updatedAt: string
}

export type FeatureFlag = {
  key: string
  label: string
  description: string
  enabled: boolean
}

export type AutopayState = {
  enabled: boolean
  mandateStatus: 'active' | 'paused'
  nextCharge: string
  note: string
}

export type AnalyticsKpis = {
  activeWorkers: number
  weeklyPremium: number
  claimsPaid: number
  fraudDetectionRate: number
  avgPayoutMinutes: number
}

export type WeeklyChartPoint = {
  week: string
  premium: number
  current?: boolean
}

export type ClaimsBreakdownItem = {
  name: string
  value: number
  fill: string
}

export type ProgressMetric = {
  label: string
  value: number
  tone: string
  note?: string
}

export type UnitEconomicsRow = {
  metric: string
  unitValue: string
  margin: string
}

export type DashboardData = {
  dateRange: string
  coverageStatus: string
  kpis: KpiCardData[]
  zoneMap: ZoneMapData
  alerts: DashboardAlert[]
  activeAlert: ActiveAlert
  payoutHistory: PayoutRow[]
  riskOutlook: RiskOutlook
  payoutState: PayoutState
  fraudAssessment: FraudAssessment
  triggerEvaluations: TriggerEvaluation[]
  quickActions: DashboardQuickAction[]
  notificationsUnread?: number
  featureFlags?: FeatureFlag[]
}

export type ClaimsData = {
  activeAlert: ActiveAlert
  verificationSignals: string[]
  payoutHistory: PayoutRow[]
  premiumHistory: PremiumHistoryItem[]
  payoutState: PayoutState
  fraudAssessment: FraudAssessment
  timeline?: ClaimTimelineEntry[]
  supportTicket?: SupportTicketSummary | null
  latestReceipt?: ReceiptSummary | null
}

export type PolicyData = {
  coverage: PolicyCoverageItem[]
  triggers: TriggerCardData[]
  premiumHistory: PremiumHistoryItem[]
  dynamicPremium: RiskOutlook
  autopayState: AutopayState
}

export type AlertsData = {
  feed: AlertsFeedItem[]
  emergencyResources: EmergencyResource[]
  supportContacts: SupportContact[]
  notifications?: NotificationItem[]
  latestTicket?: SupportTicketSummary | null
}

export type ProfileData = {
  documents: ProfileDocument[]
  settings: ProfileSetting[]
  monthlyProtectedAmount: number
}

export type AnalyticsData = {
  kpis: AnalyticsKpis
  weeklyChartData: WeeklyChartPoint[]
  claimsBreakdown: ClaimsBreakdownItem[]
  fraudSignals: ProgressMetric[]
  financialHealth: ProgressMetric[]
  unitEconomics: UnitEconomicsRow[]
  lossRatio: number
  predictedClaimsNextWeek: number
  forecastSummary: string
  zoneForecasts: Array<{
    zone: string
    primaryTrigger: string
    likelyClaims: number
    premiumDelta: number
    confidence: number
  }>
  fraudQueue: Array<{
    id: string
    workerName: string
    zone: string
    riskLabel: FraudStatus
    score: number
    reason: string
    status?: FraudReviewStatus
  }>
  recentPayouts: PayoutState[]
  payoutOps?: PayoutOpsItem[]
  featureFlags?: FeatureFlag[]
}

export type AppBootstrap = {
  user: WorkerProfile
  dashboard: DashboardData
  claims: ClaimsData
  policy: PolicyData
  alerts: AlertsData
  profile: ProfileData
  analytics?: AnalyticsData
}

export type SignupPayload = {
  name: string
  email?: string
  phone: string
  platforms: string[]
  city: string
  zone: string
  plan: PlanName
  upi: string
}

export type LoginPayload = {
  identifier?: string
  phone?: string
  email?: string
}

export type OtpRequestPayload = {
  phone: string
  purpose: OtpPurpose
  signup?: SignupPayload
}

export type OtpVerifyPayload = {
  challengeId: string
  phone: string
  code: string
}

export type AuthResponse = {
  token: string
  user: WorkerProfile
  challenge?: OtpChallenge
}

export type LandingPayload = {
  platformPartners: string[]
  landingStats: Array<{ label: string; value: string }>
  problemCards: Array<{
    title: string
    description: string
    stat: string
    emoji?: string
    statLabel?: string
  }>
  howItWorksSteps: Array<{ title: string; description: string }>
  triggerCards: TriggerCardData[]
  pricingTiers: Array<{
    tier: string
    price: string | number
    coverage: string
    features: string[]
    featured?: boolean
  }>
  trustProof?: Array<{ title: string; detail: string; metric: string }>
  faq?: Array<{ question: string; answer: string }>
  onboardingChecklist?: Array<{ title: string; description: string }>
  heroActiveAlert?: ActiveAlert
  heroWorker?: Pick<WorkerProfile, 'zone' | 'trustScore'>
}

export type ApiErrorPayload = {
  error: {
    code: string
    message: string
  }
}
