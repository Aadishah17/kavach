import { randomUUID } from 'node:crypto'
import { faker } from '@faker-js/faker'
import type { BaseWorkerProfile, FeatureFlagRecord, PlanName, ProfileSetting, SignupInput, StoredUser } from './types.js'

export const planCatalog: Record<
  PlanName,
  {
    price: number
    income: number
  }
> = {
  Basic: {
    price: 29,
    income: 2500,
  },
  Standard: {
    price: 49,
    income: 4000,
  },
  Pro: {
    price: 79,
    income: 6500,
  },
}

export const demoProfile: BaseWorkerProfile = {
  name: 'Rahul Kumar',
  platform: 'Swiggy',
  phone: '+91 98765 43210',
  platforms: ['Swiggy', 'Blinkit'],
  city: 'Bengaluru',
  zone: 'Koramangala, Bengaluru',
  plan: 'Kavach Standard',
  weeklyPremium: 49,
  iwi: 4000,
  trustScore: 92,
  upi: 'rahul@phonepe',
  kycVerified: true,
  nextDeduction: 'Monday, 13 April 2026',
  role: 'admin',
}

export const defaultProfileSettings: ProfileSetting[] = [
  { label: 'Smart Alerts', value: 'Notify me during peak hours', enabled: true },
  { label: 'AutoPay Mandate', value: 'Weekly deduction active', enabled: true },
  { label: 'App Language', value: 'English / Hindi', enabled: true, kind: 'link' },
  { label: 'Biometric Lock', value: 'Face ID / Fingerprint enabled', enabled: true },
]

export const defaultFeatureFlags: FeatureFlagRecord[] = [
  {
    key: 'worker_notifications_v2',
    label: 'Worker notifications v2',
    description: 'Shows grouped notification and timeline surfaces across web and app.',
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    key: 'admin_fraud_actions',
    label: 'Admin fraud actions',
    description: 'Enables approve, reject, escalate, and resolve controls in admin analytics.',
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    key: 'instant_payout_ops',
    label: 'Instant payout operations',
    description: 'Shows payout operations details and simulated settlement state.',
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
]

export function buildMockAppData() {
  const today = new Date()

  const formatDate = (offsetDays: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).replace(/,/g, '')
  }

  const currentWeekStr = `${formatDate(0)} - ${formatDate(6)}`

  return {
    dateRange: currentWeekStr,
  coverageStatus: 'safe',
  zoneStatus: 'triggered' as const,
  zoneMap: {
    cityLabel: 'Bengaluru South',
    zones: [
      { name: 'Koramangala', top: '50%', left: '34%', tone: 'bg-k-red', risk: 'High risk' },
      { name: 'HSR Layout', top: '68%', left: '68%', tone: 'bg-k-orange', risk: 'Medium' },
      { name: 'Indiranagar', top: '36%', left: '76%', tone: 'bg-k-green', risk: 'Clear' },
    ],
  },
  monthlyProtectedAmount: 42500,
  activeAlert: {
    type: 'Heavy Rain',
    emoji: '🌧️',
    zone: 'Koramangala',
    condition: 'IMD Red Alert · 82mm rainfall',
    payoutAmount: 571,
    triggeredAt: `2:34 PM IST, ${formatDate(0)}`,
    paidAt: `2:38 PM IST, ${formatDate(0)}`,
    coverage: 100,
  },
  payoutHistory: [
    {
      date: formatDate(0),
      type: '🌧️ Payout',
      disruption: 'Heavy Rain (Red Alert)',
      zone: 'Koramangala',
      amount: 571,
      status: 'Paid',
    },
    {
      date: formatDate(-1),
      type: '💳 Premium',
      disruption: 'Weekly AutoPay',
      zone: 'All zones',
      amount: -49,
      status: 'Paid',
    },
    {
      date: formatDate(-4),
      type: '🌧️ Payout',
      disruption: 'Heavy Rain (Orange Alert)',
      zone: 'Koramangala',
      amount: 428,
      status: 'Paid',
    },
    {
      date: formatDate(-8),
      type: '💳 Premium',
      disruption: 'Weekly AutoPay',
      zone: 'All zones',
      amount: -49,
      status: 'Paid',
    },
    {
      date: formatDate(-13),
      type: '✊ Payout',
      disruption: 'Bandh - Local Strike',
      zone: 'Indiranagar',
      amount: 214,
      status: 'Pending',
    },
  ],
  premiumHistory: [
    { cycle: 'Week 12', paidOn: formatDate(-1), amount: 49, note: 'Weekly AutoPay' },
    { cycle: 'Week 11', paidOn: formatDate(-8), amount: 49, note: 'Weekly AutoPay' },
    { cycle: 'Week 10', paidOn: formatDate(-15), amount: 49, note: 'Weekly AutoPay' },
    { cycle: 'Week 09', paidOn: formatDate(-22), amount: 49, note: 'Weekly AutoPay' },
  ],
  analyticsKpis: {
    activeWorkers: faker.number.int({ min: 45000, max: 50000 }),
    weeklyPremium: 2360000,
    claimsPaid: 910000,
    fraudDetectionRate: 94.2,
    avgPayoutMinutes: 3.8,
  },
  weeklyChartData: [
    { week: 'W1 Jan', premium: 19.2 },
    { week: 'W2 Jan', premium: 20.8 },
    { week: 'W3 Jan', premium: 24.1 },
    { week: 'W4 Jan', premium: 22.3 },
    { week: 'W1 Feb', premium: 20.1 },
    { week: 'W2 Feb', premium: 27.4 },
    { week: 'W3 Feb', premium: 23.6 },
    { week: 'W1 Mar', premium: 23.6, current: true },
  ],
  claimsBreakdown: [
    { name: 'Rain/Flood', value: 62, fill: '#1E7E5E' },
    { name: 'Civic', value: 20, fill: '#C9A96E' },
    { name: 'Other', value: 18, fill: '#B83232' },
  ],
  fraudSignals: [
    { label: 'Sensor fusion confidence', value: 96, tone: 'bg-k-green' },
    { label: 'Network similarity check', value: 91, tone: 'bg-sky' },
    { label: 'Behavioral anomaly engine', value: 88, tone: 'bg-gold' },
    { label: 'Syndicate watchlist', value: 0, tone: 'bg-k-red', note: '0 alerts' },
    { label: 'Weather correlation accuracy', value: 99, tone: 'bg-k-green' },
  ],
  financialHealth: [
    { label: 'Loss Ratio', value: 38.5, tone: 'bg-k-green' },
    { label: 'Liquidity Pool', value: 82, tone: 'bg-sky' },
    { label: 'Auto-Approval Rate', value: 78.4, tone: 'bg-gold' },
  ],
  unitEconomics: [
    { metric: 'GigCover (Rain)', unitValue: '₹49.2', margin: '+12%' },
    { metric: 'LogisticsArmor', unitValue: '₹80.6', margin: '+8.4%' },
    { metric: 'Sentinel Shield', unitValue: '₹61.8', margin: '+6.7%' },
  ],
  platformPartners: ['Zomato', 'Swiggy', 'Blinkit', 'Amazon Flex', 'Zepto', 'Dunzo', 'Porter'],
  landingStats: [
    { label: 'Base premium', value: '₹49/week' },
    { label: 'Fastest payout', value: '<4 min' },
    { label: 'Live triggers', value: '7 triggers' },
  ],
  problemCards: [
    {
      emoji: '🌧️',
      title: 'Extreme Weather',
      description:
        'Gig workers lose active earning windows during storms, flooding, and road closures with zero predictable protection.',
      stat: '18-30',
      statLabel: 'disruption days per year',
    },
    {
      emoji: '🌫️',
      title: 'Severe Pollution',
      description:
        'Air quality spikes hit NCR and tier-1 metros hardest, but workers still absorb the health and income shock alone.',
      stat: '15-25',
      statLabel: 'AQI disruption days in NCR',
    },
    {
      emoji: '🚫',
      title: 'Civic Disruptions',
      description:
        'Bandhs, curfews, and localized shutdowns produce silent income losses that never reach formal insurance.',
      stat: '₹17,500',
      statLabel: 'average unprotected annual loss',
    },
  ],
  howItWorksSteps: [
    {
      title: 'Enroll in 4 min',
      description: 'Share your platform, city zone, and payout rail once. No paperwork-heavy insurance flow.',
    },
    {
      title: 'AI monitors 24/7',
      description: 'Weather, pollution, civic alerts, and mobility signals are fused zone by zone.',
    },
    {
      title: 'Event triggers',
      description: 'Coverage activates when verified conditions cross your parametric threshold.',
    },
    {
      title: 'Paid in minutes',
      description: 'Trust scoring auto-approves low-risk payouts directly to your UPI handle.',
    },
  ],
  triggerCards: [
    { emoji: '🌧️', name: 'Heavy Rain', condition: 'IMD orange / red alert', coverage: 100 },
    { emoji: '🌊', name: 'Flood', condition: 'Waterlogging + route shutdown', coverage: 100 },
    { emoji: '🚔', name: 'Curfew', condition: 'Official movement restriction', coverage: 100 },
    { emoji: '✊', name: 'Bandh', condition: 'Local strike / market shutdown', coverage: 75 },
    { emoji: '🥵', name: 'Heat', condition: 'Extreme heat threshold crossed', coverage: 50 },
    { emoji: '🌫️', name: 'Pollution', condition: 'AQI severity window breached', coverage: 50 },
    { emoji: '🌁', name: 'Fog', condition: 'Visibility restriction verified', coverage: 75 },
    { emoji: '🛰️', name: 'More coming', condition: 'New triggers planned Q3 2026', coverage: 50 },
  ],
  pricingTiers: [
    {
      tier: 'Basic',
      price: 29,
      coverage: 'Up to ₹2,500/week insured income',
      features: ['3 trigger categories', 'Weekly autopay', 'Zone weather alerts'],
    },
    {
      tier: 'Standard',
      price: 49,
      coverage: 'Up to ₹4,000/week insured income',
      features: ['7 trigger categories', 'Instant UPI payouts', 'AI trust score auto-approval', 'Priority WhatsApp support'],
      featured: true,
    },
    {
      tier: 'Pro',
      price: 79,
      coverage: 'Up to ₹6,500/week insured income',
      features: ['Family backup wallet', 'Emergency cash advance', 'Claims concierge'],
    },
  ],
  trustProof: [
    {
      title: 'Fast payout proof',
      detail: 'Recent weather-linked payout settled to UPI in under 4 minutes.',
      metric: '₹571 in 4 min',
    },
    {
      title: 'Fraud-safe automation',
      detail: 'GPS, weather correlation, and duplicate cluster checks stop fake delivery claims.',
      metric: '94.2% fraud catch rate',
    },
    {
      title: 'Active protection',
      detail: 'Worker zones are monitored continuously with pricing adjustments explained in-app.',
      metric: '48,271 workers covered',
    },
  ],
  faq: [
    {
      question: 'How does zero-touch payout work?',
      answer: 'Kavach verifies the zone event, validates fraud signals, and sends simulated payout instantly to the worker payout rail.',
    },
    {
      question: 'Why did my weekly premium change?',
      answer: 'The premium moves within a capped range based on hyper-local risk such as rain, waterlogging history, AQI, and trust discounts.',
    },
    {
      question: 'What if a claim looks suspicious?',
      answer: 'GPS spoof checks, historical weather matching, and duplicate cluster review move the event into watch or manual review before settlement.',
    },
    {
      question: 'Can I pause AutoPay?',
      answer: 'Yes. Workers can pause weekly deductions while keeping the current cycle active, then resume when they are ready.',
    },
  ],
  dashboardKpis: [
    {
      label: 'Payout this week',
      value: '₹571',
      hint: '↑ Tuesday rain event',
      accent: 'green' as const,
    },
    {
      label: 'Trust score',
      value: '92',
      hint: '↑ Excellent',
      accent: 'sky' as const,
    },
    {
      label: 'Days protected',
      value: '3 days',
      hint: 'Mon - Wed covered',
      accent: 'gold' as const,
    },
    {
      label: 'Insured weekly income',
      value: '₹4,000',
      hint: 'Standard plan',
      accent: 'navy' as const,
      inverse: true,
    },
  ],
  dashboardAlerts: [
    {
      emoji: '🌧️',
      title: 'Heavy Rain Alert',
      subtitle: 'Expected 1-3h in Koramangala. Disruption payout active.',
      status: 'Critical',
      tone: 'border-k-red',
    },
    {
      emoji: '🚧',
      title: 'High Traffic Node',
      subtitle: 'Silk Board junction congestion. Avoid for 45 mins.',
      status: 'Medium',
      tone: 'border-k-orange',
    },
    {
      emoji: '⭐',
      title: 'Fleet Incentive',
      subtitle: 'Kavach members get 2x trust points tonight.',
      status: 'Bonus',
      tone: 'border-gold',
    },
  ],
  verificationSignals: ['Movement ✓', 'Network ✓', 'Weather ✓', 'No Cluster ✓'],
  policyCoverage: [
    {
      title: 'Rain & Flood Triggers',
      description:
        'Orange and red alert conditions trigger payout protection when routes are disrupted by rainfall or flooding.',
      badge: '100% COVER',
    },
    {
      title: 'Civic Shutdown Cover',
      description:
        'Curfews, bandhs and verified civic restrictions unlock partial or full income protection based on severity.',
      badge: '75% COVER',
    },
    {
      title: 'Heat, AQI & Fog Watch',
      description:
        'Environmental risk windows protect workers when unsafe riding conditions reduce viable working hours.',
      badge: '50% COVER',
    },
  ],
  alertsFeed: [
    {
      category: 'Live trigger',
      title: 'Heavy rain lock applied in Koramangala',
      description: 'Auto-payout threshold crossed at 82mm rainfall.',
      status: 'Triggered',
    },
    {
      category: 'AQI watch',
      title: 'Pollution escalation expected 8 PM onwards',
      description: 'Prepare for evening shift slowdown in central Bengaluru.',
      status: 'Alert',
    },
    {
      category: 'Coverage note',
      title: 'Premium auto-deduct scheduled for Monday',
      description: 'No action needed. UPI Autopay mandate is active.',
      status: 'Active',
    },
  ],
  emergencyResources: [
    {
      title: 'Roadside Assistance',
      description: 'Towing, flat tyre, and fuel delivery coverage when you are mid-shift.',
      cta: 'Request help',
    },
    {
      title: 'Nearby Hospitals',
      description: 'Fast access to empanelled care points and live travel distances.',
      cta: 'Open locator',
    },
    {
      title: 'Guardian Chat',
      description: 'Real humans standing by for claims and emergency escalation.',
      cta: 'Start chat',
    },
  ],
  supportContacts: [
    { initials: 'SM', name: 'Sarah Miller', relation: 'Wife', phone: '9000000001' },
    { initials: 'JD', name: 'John Deo', relation: 'Hub Manager', phone: '9000000002' },
    { initials: 'RV', name: 'Ravi Varma', relation: 'Area Lead', phone: '9000000003' },
  ],
  profileDocuments: [
    { name: 'Aadhaar Card', meta: 'Verified · 12 Oct 2023', status: 'Verified' },
    { name: 'Driving License', meta: 'Expires · 24 Jan 2028', status: 'Active' },
    { name: 'Zomato Partner ID', meta: 'Linked account', status: 'Linked' },
  ],
  profileSettings: defaultProfileSettings,
  onboardingZones: [
    'Koramangala, Bengaluru',
    'HSR Layout, Bengaluru',
    'Indiranagar, Bengaluru',
    'Andheri East, Mumbai',
    'Noida Sector 18, NCR',
  ],
  onboardingChecklist: [
    {
      title: 'Tell us who you are',
      description: 'Simple identity verification to get started.',
    },
    {
      title: 'Select your platforms',
      description: 'We sync with your active delivery partners.',
    },
    {
      title: 'Coverage plan',
      description: 'Choose a shield that fits your daily earnings.',
    },
    {
      title: 'Activate Guardian',
      description: 'Finalize setup and ride with peace of mind.',
    },
  ],
  }
}

export const staticAppData = buildMockAppData()

export function buildDemoUser() {
  return {
    id: 'user-demo',
    email: 'demo@kavach.local',
    status: 'active' as const,
    createdAt: '2026-03-18T08:00:00.000Z',
    updatedAt: '2026-03-18T08:00:00.000Z',
    lastLoginAt: null,
    ...demoProfile,
  } satisfies StoredUser
}

export function buildDemoWorkerUser() {
  return {
    id: 'user-demo-worker',
    email: '919000077777@kavach.local',
    status: 'active' as const,
    createdAt: '2026-03-18T08:05:00.000Z',
    updatedAt: '2026-03-18T08:05:00.000Z',
    lastLoginAt: null,
    name: 'Kavach Test Worker',
    platform: 'Swiggy',
    phone: '+91 90000 77777',
    platforms: ['Swiggy', 'Zomato'],
    city: 'Bengaluru',
    zone: 'Koramangala, Bengaluru',
    plan: 'Kavach Standard',
    weeklyPremium: 49,
    iwi: 4000,
    trustScore: 91,
    upi: 'kavachworker@upi',
    kycVerified: true,
    nextDeduction: 'Monday, 13 April 2026',
    role: 'worker' as const,
  } satisfies StoredUser
}

export function buildSignupUser(input: SignupInput) {
  const pricing = planCatalog[input.plan]

  if (!pricing) {
    throw new Error(`Unsupported plan: ${input.plan}`)
  }

  const user: StoredUser = {
    id: randomUUID(),
    email: normalizeSignupEmail(input),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null,
    name: input.name.trim(),
    platform: input.platforms[0] ?? 'Swiggy',
    phone: input.phone.trim(),
    platforms: input.platforms,
    city: input.city.trim(),
    zone: `${input.zone.trim()}, ${input.city.trim()}`,
    plan: `Kavach ${input.plan}`,
    weeklyPremium: pricing.price,
    iwi: pricing.income,
    trustScore: 92,
    upi: input.upi.trim(),
    kycVerified: true,
    nextDeduction: 'Monday, 13 April 2026',
    role: 'worker',
  }

  return user
}

function normalizeSignupEmail(input: SignupInput) {
  const provided = input.email?.trim().toLowerCase()
  if (provided) {
    return provided
  }

  return `${input.phone.replace(/\D/g, '') || 'worker'}@kavach.local`
}
