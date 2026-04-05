import { randomUUID } from 'node:crypto'
import type {
  ActiveAlert,
  AnalyticsData,
  DashboardData,
  DashboardQuickAction,
  FraudAssessment,
  FraudStatus,
  PayoutState,
  PaymentProvider,
  RiskLevel,
  RiskOutlook,
  TriggerEvaluation,
} from '../packages/shared/src/types.js'
import { staticAppData } from './seed.js'
import type { StoredUser } from './types.js'

type ZoneSnapshot = {
  level: RiskLevel
  premiumDelta: number
  coverageHours: number
  confidence: number
  nextLikelyTrigger: string
  summary: string
}

const defaultZoneSnapshot: ZoneSnapshot = {
  level: 'moderate',
  premiumDelta: 0,
  coverageHours: 52,
  confidence: 74,
  nextLikelyTrigger: 'Heavy Rain',
  summary: 'Mixed weather and route conditions keep the zone under active watch.',
}

const zoneSnapshots: Array<{ match: RegExp; snapshot: ZoneSnapshot }> = [
  {
    match: /koramangala/i,
    snapshot: {
      level: 'high',
      premiumDelta: 3,
      coverageHours: 68,
      confidence: 88,
      nextLikelyTrigger: 'Heavy Rain + Waterlogging',
      summary: 'Heavy rain probability and historic waterlogging keep this zone in high-alert pricing.',
    },
  },
  {
    match: /saket/i,
    snapshot: {
      level: 'moderate',
      premiumDelta: 1,
      coverageHours: 56,
      confidence: 79,
      nextLikelyTrigger: 'Air Quality Disruption',
      summary: 'Air quality and traffic volatility drive a moderate disruption outlook.',
    },
  },
  {
    match: /indiranagar/i,
    snapshot: {
      level: 'low',
      premiumDelta: -2,
      coverageHours: 44,
      confidence: 71,
      nextLikelyTrigger: 'Traffic Slowdown',
      summary: 'This zone has remained comparatively flood-safe and is priced with a loyalty discount.',
    },
  },
  {
    match: /hsr/i,
    snapshot: {
      level: 'moderate',
      premiumDelta: 0,
      coverageHours: 50,
      confidence: 76,
      nextLikelyTrigger: 'Traffic Slowdown',
      summary: 'Route congestion and intermittent rain keep this zone on steady monitoring.',
    },
  },
]

function getZoneSnapshot(zone: string) {
  return zoneSnapshots.find((item) => item.match.test(zone))?.snapshot ?? defaultZoneSnapshot
}

function getFraudStatus(score: number): FraudStatus {
  if (score >= 85) {
    return 'clear'
  }

  if (score >= 65) {
    return 'watch'
  }

  return 'review'
}

export function buildRiskOutlook(user: StoredUser): RiskOutlook {
  const zoneSnapshot = getZoneSnapshot(user.zone)

  return {
    level: zoneSnapshot.level,
    summary: zoneSnapshot.summary,
    nextLikelyTrigger: zoneSnapshot.nextLikelyTrigger,
    premiumDelta: zoneSnapshot.premiumDelta,
    protectedAmount: Math.round(user.iwi * (zoneSnapshot.coverageHours / 24)),
    coverageHours: zoneSnapshot.coverageHours,
    confidence: zoneSnapshot.confidence,
  }
}

export function buildFraudAssessment(user: StoredUser): FraudAssessment {
  const zoneSnapshot = getZoneSnapshot(user.zone)
  const gpsScore = Math.max(58, Math.min(98, user.trustScore - (zoneSnapshot.level === 'high' ? 10 : 2)))
  const weatherScore = Math.max(60, Math.min(99, user.trustScore + 4))
  const clusterScore = Math.max(55, Math.min(97, user.trustScore - (zoneSnapshot.level === 'moderate' ? 5 : 1)))
  const behaviorScore = Math.max(62, Math.min(98, user.trustScore + (user.kycVerified ? 2 : -8)))

  const signals = [
    {
      label: 'GPS spoof risk',
      score: gpsScore,
      status: getFraudStatus(gpsScore),
      reason:
        zoneSnapshot.level === 'high'
          ? 'High-risk zones receive tighter movement validation to catch spoofed location trails.'
          : 'Movement patterns match a normal delivery path profile.',
    },
    {
      label: 'Weather correlation',
      score: weatherScore,
      status: getFraudStatus(weatherScore),
      reason: 'Claim timing is cross-checked against forecast and hyper-local weather severity.',
    },
    {
      label: 'Duplicate cluster claims',
      score: clusterScore,
      status: getFraudStatus(clusterScore),
      reason: 'Nearby claim clustering is monitored to stop synthetic route-level payout bursts.',
    },
    {
      label: 'Behavior anomaly',
      score: behaviorScore,
      status: getFraudStatus(behaviorScore),
      reason: 'Recent shift patterns and device trust signals are within expected bounds.',
    },
  ]

  const score = Math.round(signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length)
  const status = getFraudStatus(score)

  return {
    score,
    status,
    summary:
      status === 'clear'
        ? 'Delivery trail, weather data, and device trust signals support zero-touch approvals.'
        : status === 'watch'
          ? 'One or more signals need monitoring before the next automated payout.'
          : 'Manual review is recommended before settlement.',
    signals,
  }
}

export function buildTriggerEvaluations(user: StoredUser): TriggerEvaluation[] {
  const zoneSnapshot = getZoneSnapshot(user.zone)
  const riskBoost = zoneSnapshot.level === 'high' ? 16 : zoneSnapshot.level === 'moderate' ? 8 : -6

  return [
    {
      id: 'rain',
      name: 'Heavy Rain',
      source: 'public',
      status: zoneSnapshot.level === 'high' ? 'triggered' : 'watch',
      detail: 'Open-Meteo precipitation outlook indicates short-window earning loss risk.',
      probability: Math.max(38, 62 + riskBoost),
    },
    {
      id: 'waterlogging',
      name: 'Waterlogging',
      source: 'mock',
      status: zoneSnapshot.level === 'high' ? 'triggered' : 'watch',
      detail: 'Historical drain congestion plus route closure susceptibility is above baseline.',
      probability: Math.max(24, 48 + riskBoost),
    },
    {
      id: 'aqi',
      name: 'Air Quality',
      source: 'public',
      status: /delhi|saket|noida/i.test(user.zone) ? 'watch' : 'clear',
      detail: 'AQI severity is tracked to extend coverage during unsafe riding windows.',
      probability: /delhi|saket|noida/i.test(user.zone) ? 58 : 26,
    },
    {
      id: 'traffic',
      name: 'Traffic Disruption',
      source: 'mock',
      status: zoneSnapshot.level === 'low' ? 'watch' : 'triggered',
      detail: 'Route slowdown anomalies identify city events that suppress completed deliveries.',
      probability: zoneSnapshot.level === 'low' ? 44 : 73,
    },
    {
      id: 'civic',
      name: 'Civic Restriction',
      source: 'mock',
      status: 'clear',
      detail: 'Bandh or curfew feeds remain quiet for the current planning window.',
      probability: 9,
    },
  ]
}

export function buildPayoutState(
  user: StoredUser,
  provider: PaymentProvider = 'upi_mock',
  activeAlert: ActiveAlert = staticAppData.activeAlert,
  reference = `payout-${user.id}-latest`,
): PayoutState {
  return {
    reference,
    amount: activeAlert.payoutAmount,
    status: 'paid',
    provider,
    rail: user.upi,
    etaMinutes: provider === 'upi_mock' ? 2 : 4,
    updatedAt: activeAlert.paidAt,
  }
}

export function simulateInstantPayout(
  user: StoredUser,
  provider: PaymentProvider = 'upi_mock',
) {
  const payout = buildPayoutState(user, provider, staticAppData.activeAlert, `payout-${user.id}-${randomUUID()}`)

  return {
    payout,
    message: `Instant payout simulated via ${provider}.`,
  }
}

export function buildQuickActions(): DashboardQuickAction[] {
  return [
    {
      id: 'support',
      label: 'Emergency support',
      description: 'Request a live callback from Kavach Guardian.',
      action: 'support',
      tone: 'primary',
    },
    {
      id: 'receipt',
      label: 'Download receipt',
      description: 'Get the latest payout receipt for reimbursement and audits.',
      action: 'receipt',
      tone: 'secondary',
    },
    {
      id: 'autopay',
      label: 'Manage AutoPay',
      description: 'Review mandate status and your next premium deduction.',
      action: 'autopay',
      tone: 'ghost',
    },
    {
      id: 'upgrade',
      label: 'Upgrade plan',
      description: 'Increase weekly cover when your route or income changes.',
      action: 'upgrade',
      tone: 'ghost',
    },
  ]
}

export function buildDashboardIntelligence(user: StoredUser): Pick<
  DashboardData,
  'riskOutlook' | 'payoutState' | 'fraudAssessment' | 'triggerEvaluations' | 'quickActions'
> {
  return {
    riskOutlook: buildRiskOutlook(user),
    payoutState: buildPayoutState(user),
    fraudAssessment: buildFraudAssessment(user),
    triggerEvaluations: buildTriggerEvaluations(user),
    quickActions: buildQuickActions(),
  }
}

export function buildAnalyticsIntelligence(user: StoredUser): Pick<
  AnalyticsData,
  'lossRatio' | 'predictedClaimsNextWeek' | 'forecastSummary' | 'zoneForecasts' | 'fraudQueue' | 'recentPayouts'
> {
  const zoneForecasts = [
    {
      zone: 'Koramangala',
      primaryTrigger: 'Heavy Rain + Waterlogging',
      likelyClaims: 142,
      premiumDelta: 3,
      confidence: 88,
    },
    {
      zone: 'Saket',
      primaryTrigger: 'Air Quality',
      likelyClaims: 79,
      premiumDelta: 1,
      confidence: 79,
    },
    {
      zone: 'Indiranagar',
      primaryTrigger: 'Traffic Disruption',
      likelyClaims: 41,
      premiumDelta: -2,
      confidence: 71,
    },
  ]

  return {
    lossRatio: 38.5,
    predictedClaimsNextWeek: 262,
    forecastSummary: 'Weather-led claims are likely to rise next week, led by Koramangala rain/flood exposure.',
    zoneForecasts,
    fraudQueue: [
      {
        id: 'fraud-001',
        workerName: 'Rohit Mehra',
        zone: 'Koramangala',
        riskLabel: 'watch',
        score: 67,
        reason: 'Movement variance exceeds the normal delivery corridor pattern.',
      },
      {
        id: 'fraud-002',
        workerName: 'Asha Khan',
        zone: 'Saket',
        riskLabel: 'review',
        score: 58,
        reason: 'Weather severity does not fully match the reported delivery loss window.',
      },
    ],
    recentPayouts: [
      buildPayoutState(user, 'upi_mock'),
      {
        reference: 'payout-user-demo-archive',
        amount: 428,
        status: 'processing',
        provider: 'razorpay_test',
        rail: 'rahul@phonepe',
        etaMinutes: 4,
        updatedAt: '1:08 PM IST, Mon 17 Mar 2026',
      },
    ],
  }
}

export function buildAnalyticsExportCsv() {
  const rows = buildAnalyticsIntelligence({
    id: 'export-admin',
    email: 'admin@kavach.local',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    name: 'Admin',
    platform: 'Kavach Ops',
    phone: '9999999999',
    platforms: ['Kavach Ops'],
    city: 'Bengaluru',
    zone: 'Koramangala',
    plan: 'Kavach Pro',
    weeklyPremium: 79,
    iwi: 6500,
    trustScore: 96,
    upi: 'admin@upi',
    kycVerified: true,
    nextDeduction: 'Monday, 24 March 2026',
    role: 'admin',
  }).zoneForecasts

  return [
    'zone,primaryTrigger,likelyClaims,premiumDelta,confidence',
    ...rows.map((row) =>
      [
        row.zone,
        row.primaryTrigger,
        row.likelyClaims,
        row.premiumDelta,
        row.confidence,
      ].join(','),
    ),
  ].join('\n')
}
