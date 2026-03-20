export type ZoneStatus = 'safe' | 'alert' | 'triggered'

export const worker = {
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
  nextDeduction: 'Monday, 24 March 2026',
  role: 'admin' as const,
}

export const zoneStatus: ZoneStatus = 'triggered'

export const activeAlert = {
  type: 'Heavy Rain',
  emoji: '🌧️',
  zone: 'Koramangala',
  condition: 'IMD Red Alert · 82mm rainfall',
  payoutAmount: 571,
  triggeredAt: '2:34 PM IST, Tue 18 Mar 2026',
  paidAt: '2:38 PM IST, Tue 18 Mar 2026',
  coverage: 100,
}

export const payoutHistory = [
  {
    date: 'Tue 18 Mar 2026',
    type: '🌧️ Payout',
    disruption: 'Heavy Rain (Red Alert)',
    zone: 'Koramangala',
    amount: 571,
    status: 'Paid',
  },
  {
    date: 'Mon 17 Mar 2026',
    type: '💳 Premium',
    disruption: 'Weekly AutoPay',
    zone: 'All zones',
    amount: -49,
    status: 'Paid',
  },
  {
    date: 'Fri 14 Mar 2026',
    type: '🌧️ Payout',
    disruption: 'Heavy Rain (Orange Alert)',
    zone: 'Koramangala',
    amount: 428,
    status: 'Paid',
  },
  {
    date: 'Mon 10 Mar 2026',
    type: '💳 Premium',
    disruption: 'Weekly AutoPay',
    zone: 'All zones',
    amount: -49,
    status: 'Paid',
  },
  {
    date: 'Wed 5 Mar 2026',
    type: '✊ Payout',
    disruption: 'Bandh – Local Strike',
    zone: 'Indiranagar',
    amount: 214,
    status: 'Pending',
  },
]

export const premiumHistory = [
  { cycle: 'Week 12', paidOn: 'Mon 17 Mar', amount: 49, note: 'Weekly AutoPay' },
  { cycle: 'Week 11', paidOn: 'Mon 10 Mar', amount: 49, note: 'Weekly AutoPay' },
  { cycle: 'Week 10', paidOn: 'Mon 03 Mar', amount: 49, note: 'Weekly AutoPay' },
  { cycle: 'Week 09', paidOn: 'Mon 24 Feb', amount: 49, note: 'Weekly AutoPay' },
]

export const analyticsKpis = {
  activeWorkers: 48271,
  weeklyPremium: 2360000,
  claimsPaid: 910000,
  fraudDetectionRate: 94.2,
  avgPayoutMinutes: 3.8,
}

export const weeklyChartData = [
  { week: 'W1 Jan', premium: 19.2 },
  { week: 'W2 Jan', premium: 20.8 },
  { week: 'W3 Jan', premium: 24.1 },
  { week: 'W4 Jan', premium: 22.3 },
  { week: 'W1 Feb', premium: 20.1 },
  { week: 'W2 Feb', premium: 27.4 },
  { week: 'W3 Feb', premium: 23.6 },
  { week: 'W1 Mar', premium: 23.6, current: true },
]

export const claimsBreakdown = [
  { name: 'Rain/Flood', value: 62, fill: '#1E7E5E' },
  { name: 'Civic', value: 20, fill: '#C9A96E' },
  { name: 'Other', value: 18, fill: '#B83232' },
]

export const fraudSignals = [
  { label: 'Sensor fusion confidence', value: 96, tone: 'bg-k-green' },
  { label: 'Network similarity check', value: 91, tone: 'bg-sky' },
  { label: 'Behavioral anomaly engine', value: 88, tone: 'bg-gold' },
  { label: 'Syndicate watchlist', value: 0, tone: 'bg-k-red', note: '0 alerts' },
  { label: 'Weather correlation accuracy', value: 99, tone: 'bg-k-green' },
]

export const financialHealth = [
  { label: 'Loss Ratio', value: 38.5, tone: 'bg-k-green' },
  { label: 'Liquidity Pool', value: 82, tone: 'bg-sky' },
  { label: 'Auto-Approval Rate', value: 78.4, tone: 'bg-gold' },
]

export const unitEconomics = [
  { metric: 'GigCover (Rain)', unitValue: '₹49.2', margin: '+12%' },
  { metric: 'LogisticsArmor', unitValue: '₹80.6', margin: '+8.4%' },
  { metric: 'Sentinel Shield', unitValue: '₹61.8', margin: '+6.7%' },
]

export const platformPartners = [
  'Zomato',
  'Swiggy',
  'Blinkit',
  'Amazon Flex',
  'Zepto',
  'Dunzo',
  'Porter',
]

export const landingStats = [
  { label: 'Base premium', value: '₹49/week' },
  { label: 'Fastest payout', value: '<4 min' },
  { label: 'Live triggers', value: '7 triggers' },
]

export const problemCards = [
  {
    emoji: '🌧️',
    title: 'Extreme Weather',
    description:
      'Gig workers lose active earning windows during storms, flooding, and road closures with zero predictable protection.',
    stat: '18–30',
    statLabel: 'disruption days per year',
  },
  {
    emoji: '🌫️',
    title: 'Severe Pollution',
    description:
      'Air quality spikes hit NCR and tier-1 metros hardest, but workers still absorb the health and income shock alone.',
    stat: '15–25',
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
]

export const howItWorksSteps = [
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
]

export const triggerCards = [
  { emoji: '🌧️', name: 'Heavy Rain', condition: 'IMD orange / red alert', coverage: 100 },
  { emoji: '🌊', name: 'Flood', condition: 'Waterlogging + route shutdown', coverage: 100 },
  { emoji: '🚔', name: 'Curfew', condition: 'Official movement restriction', coverage: 100 },
  { emoji: '✊', name: 'Bandh', condition: 'Local strike / market shutdown', coverage: 75 },
  { emoji: '🥵', name: 'Heat', condition: 'Extreme heat threshold crossed', coverage: 50 },
  { emoji: '🌫️', name: 'Pollution', condition: 'AQI severity window breached', coverage: 50 },
  { emoji: '🌁', name: 'Fog', condition: 'Visibility restriction verified', coverage: 75 },
  { emoji: '🛰️', name: 'More coming', condition: 'New triggers planned Q3 2026', coverage: 50 },
]

export const pricingTiers = [
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
    features: [
      '7 trigger categories',
      'Instant UPI payouts',
      'AI trust score auto-approval',
      'Priority WhatsApp support',
    ],
    featured: true,
  },
  {
    tier: 'Pro',
    price: 79,
    coverage: 'Up to ₹6,500/week insured income',
    features: ['Family backup wallet', 'Emergency cash advance', 'Claims concierge'],
  },
]

export const dashboardKpis = [
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
    hint: 'Mon–Wed covered',
    accent: 'gold' as const,
  },
  {
    label: 'Insured weekly income',
    value: '₹4,000',
    hint: 'Standard plan',
    accent: 'navy' as const,
    inverse: true,
  },
]

export const dashboardAlerts = [
  {
    emoji: '🌧️',
    title: 'Heavy Rain Alert',
    subtitle: 'Expected 1–3h in Koramangala. Disruption payout active.',
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
]

export const verificationSignals = [
  'Movement ✓',
  'Network ✓',
  'Weather ✓',
  'No Cluster ✓',
]

export const policyCoverage = [
  {
    title: 'Accident Protection',
    description:
      'Coverage for on-job mishaps and minor road incidents while you work.',
    badge: 'UP TO',
  },
  {
    title: 'Rain & Weather Loss',
    description:
      'Earnings protection for days when the weather prevents you from reaching targets.',
    badge: 'WEATHER',
  },
  {
    title: 'Daily Health Allowance',
    description:
      'Financial support for medical leave and unexpected illness recovery periods.',
    badge: '₹150 / DAY',
  },
]

export const alertsFeed = [
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
]

export const emergencyResources = [
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
]

export const supportContacts = [
  { initials: 'SM', name: 'Sarah Miller', relation: 'Wife', phone: '9000000001' },
  { initials: 'JD', name: 'John Deo', relation: 'Hub Manager', phone: '9000000002' },
  { initials: 'RV', name: 'Ravi Varma', relation: 'Area Lead', phone: '9000000003' },
]

export const profileDocuments = [
  { name: 'Aadhaar Card', meta: 'Verified · 12 Oct 2023', status: 'Verified' },
  { name: 'Driving License', meta: 'Expires · 24 Jan 2028', status: 'Active' },
  { name: 'Zomato Partner ID', meta: 'Linked account', status: 'Linked' },
]

export const profileSettings = [
  { label: 'Smart Alerts', value: 'Notify me during peak hours', enabled: true },
  { label: 'App Language', value: 'English / Hindi', enabled: true, kind: 'link' },
  { label: 'Biometric Lock', value: 'Face ID / Fingerprint enabled', enabled: true },
]

export const onboardingZones = [
  'Koramangala, Bengaluru',
  'HSR Layout, Bengaluru',
  'Indiranagar, Bengaluru',
  'Andheri East, Mumbai',
  'Noida Sector 18, NCR',
]

export const onboardingChecklist = [
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
]
