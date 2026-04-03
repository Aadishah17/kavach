export type CoverageStatus = 'paid' | 'pending' | 'flagged' | 'active' | 'safe' | 'alert'
export type WorkerRole = 'worker' | 'admin'
export type PlanName = 'Basic' | 'Standard' | 'Pro'
export type KpiAccent = 'green' | 'sky' | 'gold' | 'navy'

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
  category: string
  title: string
  description: string
  status: string
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
}

export type ClaimsData = {
  activeAlert: ActiveAlert
  verificationSignals: string[]
  payoutHistory: PayoutRow[]
  premiumHistory: PremiumHistoryItem[]
}

export type PolicyData = {
  coverage: PolicyCoverageItem[]
  triggers: TriggerCardData[]
  premiumHistory: PremiumHistoryItem[]
}

export type AlertsData = {
  feed: AlertsFeedItem[]
  emergencyResources: EmergencyResource[]
  supportContacts: SupportContact[]
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
  phone: string
  platforms: string[]
  city: string
  zone: string
  plan: PlanName
  upi: string
}

export type AuthResponse = {
  token: string
  user: WorkerProfile
}

export type LandingPayload = {
  platformPartners: string[]
  landingStats: Array<{ label: string; value: string }>
  problemCards: Array<{ title: string; description: string; stat: string }>
  howItWorksSteps: Array<{ title: string; description: string }>
  triggerCards: TriggerCardData[]
  pricingTiers: Array<{
    tier: string
    price: string
    coverage: string
    features: string[]
    featured?: boolean
  }>
}

export type ApiErrorPayload = {
  error: {
    code: string
    message: string
  }
}
