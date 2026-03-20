import { motion } from 'framer-motion'
import { CalendarDays, MapPin } from 'lucide-react'
import { KpiCard } from '../components/KpiCard'
import { StatusPill } from '../components/StatusPill'
import { ZoneMap } from '../components/ZoneMap'
import { useAuth } from '../context/AuthContext'
import { activeAlert, dashboardAlerts, payoutHistory, worker } from '../data/mockData'
import { pageTransition } from '../lib/motion'
import { formatSignedCurrency } from '../utils/format'

export function DashboardPage() {
  const { user } = useAuth()
  const profile = user ?? worker

  const cards = [
    { label: 'Payout this week', value: '₹571', hint: '↑ Tuesday rain event', accent: 'green' as const },
    { label: 'Trust score', value: `${profile.trustScore}`, hint: '↑ Excellent', accent: 'sky' as const },
    { label: 'Days protected', value: '3 days', hint: 'Mon–Wed covered', accent: 'gold' as const },
    {
      label: 'Insured weekly income',
      value: `₹${profile.iwi.toLocaleString('en-IN')}`,
      hint: 'Standard plan',
      accent: 'navy' as const,
      inverse: true,
    },
  ]

  return (
    <motion.div
      {...pageTransition}
      className="section-shell space-y-8 pb-10"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-serif text-[clamp(2.4rem,5vw,4.2rem)] text-navy">Good morning 👋 {profile.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky" />
              {profile.zone} · {profile.platform} fleet partner
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-light bg-white px-4 py-2 text-sm text-muted">
            <CalendarDays className="h-4 w-4 text-sky" />
            18 Mar - 24 Mar 2026
          </span>
          <StatusPill status="safe">Coverage Active</StatusPill>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard
            key={card.label}
            {...card}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <ZoneMap />
        <div className="panel-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">Intelligence feed</p>
              <h2 className="mt-2 text-2xl font-serif text-navy">Active alerts</h2>
            </div>
            <StatusPill status="active">3 live</StatusPill>
          </div>
          <div className="space-y-4">
            {dashboardAlerts.map((alert) => (
              <motion.article
                key={alert.title}
                whileHover={{ y: -3 }}
                className={`rounded-[22px] border-l-4 bg-sky-pale/40 p-4 ${alert.tone}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="text-xl">{alert.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-navy">{alert.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{alert.subtitle}</p>
                    </div>
                  </div>
                  <StatusPill status={alert.status} />
                </div>
              </motion.article>
            ))}
          </div>
          <div className="mt-5 rounded-[24px] bg-navy p-5 text-white">
            <p className="mono-label !text-sky-light">Latest trigger</p>
            <h3 className="mt-3 font-serif text-3xl text-gold">₹{activeAlert.payoutAmount}</h3>
            <p className="mt-2 text-sm text-sky-light/80">{activeAlert.condition}</p>
          </div>
        </div>
      </div>

      <div className="table-shell">
        <div className="flex items-center justify-between border-b border-sky-light px-5 py-5">
          <div>
            <p className="mono-label">Recent payout activity</p>
            <h2 className="mt-2 text-2xl font-serif text-navy">Ledger</h2>
          </div>
          <StatusPill status="active">Live sync</StatusPill>
        </div>
        <div className="fine-scrollbar overflow-x-auto">
          <div className="table-row-ledger border-b border-sky-light/80 bg-sky-pale/40 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            <span>Date</span>
            <span>Type</span>
            <span>Disruption</span>
            <span>Zone</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {payoutHistory.map((entry) => (
            <div
              key={`${entry.date}-${entry.type}`}
              className="table-row-ledger border-b border-sky-light/60 last:border-b-0"
            >
              <span className="text-sm text-muted">{entry.date}</span>
              <span className="font-medium text-navy">{entry.type}</span>
              <span className="text-sm text-muted">{entry.disruption}</span>
              <span className="text-sm text-muted">{entry.zone}</span>
              <span className={entry.amount > 0 ? 'font-semibold text-k-green' : 'font-semibold text-k-red'}>
                {formatSignedCurrency(entry.amount)}
              </span>
              <StatusPill status={entry.status} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
