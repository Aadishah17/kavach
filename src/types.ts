export type CoverageStatus = 'paid' | 'pending' | 'flagged' | 'active' | 'safe' | 'alert'

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
  role: 'worker' | 'admin'
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
