import { motion } from 'framer-motion'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { formatCurrency } from '../utils/format'

export function PolicyPage() {
  const { user } = useAuth()
  const { data } = useAppData()

  if (!user || !data) {
    return null
  }

  return (
    <motion.section
      {...pageTransition}
      className="space-y-8 pb-4"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono-label">Policy details</p>
          <h1 className="mt-3 text-[44px] leading-none">{user.plan}</h1>
          <p className="mt-3 text-base text-muted">A parametric protection plan designed around real gig-economy risk.</p>
        </div>
        <StatusPill status="active" />
      </header>

      <section className="grid gap-4 lg:grid-cols-4">
        <SummaryCard label="Weekly premium" value={formatCurrency(user.weeklyPremium)} hint="Every Monday" />
        <SummaryCard label="Insured income" value={formatCurrency(user.iwi)} hint="Weekly cap" />
        <SummaryCard label="Trust score" value={String(user.trustScore)} hint="Auto-approved" />
        <SummaryCard label="Next deduction" value="24 Mar" hint={user.nextDeduction} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel-card p-6">
          <p className="mono-label">Policy overview</p>
          <h2 className="mt-2 text-3xl">What your cover includes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {data.policy.coverage.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-kavach p-5"
              >
                <span className="inline-flex rounded-full bg-gold-light px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
                  {item.badge}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel-card p-6">
          <p className="mono-label">Trigger matrix</p>
          <h2 className="mt-2 text-3xl">Coverage readiness</h2>
          <div className="mt-6 space-y-3">
            {data.policy.triggers.map((card) => (
              <div
                key={card.name}
                className="flex items-center justify-between rounded-2xl bg-kavach px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{card.emoji}</span>
                  <div>
                    <div className="font-semibold text-navy">{card.name}</div>
                    <div className="text-sm text-muted">{card.condition}</div>
                  </div>
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-gold">{card.coverage}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="table-shell fine-scrollbar overflow-x-auto">
        <div className="flex items-center justify-between border-b border-sky-light px-5 py-5">
          <div>
            <p className="mono-label">Premium history</p>
            <h2 className="mt-2 text-3xl">Mandate schedule</h2>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-sky"
          >
            Download receipt
          </button>
        </div>
        {data.policy.premiumHistory.map((item) => (
          <div
            key={item.cycle}
            className="grid min-w-[640px] grid-cols-[1fr_1fr_1fr] gap-4 border-b border-sky-light px-5 py-4 text-sm last:border-b-0"
          >
            <div className="font-semibold text-navy">{item.cycle}</div>
            <div className="text-muted">{item.paidOn}</div>
            <div className="text-right font-semibold text-navy">{formatCurrency(item.amount)}</div>
          </div>
        ))}
      </section>
    </motion.section>
  )
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="panel-card p-5">
      <p className="mono-label">{label}</p>
      <div className="mt-3 font-serif text-4xl text-navy">{value}</div>
      <p className="mt-3 text-sm text-muted">{hint}</p>
    </div>
  )
}
