import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { activeAlert, worker } from '../data/mockData'
import { useAnimatedCounter } from '../hooks/useAnimatedCounter'
import { formatCurrency } from '../utils/format'

export function MockDashboardCard() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  const animatedAmount = useAnimatedCounter(activeAlert.payoutAmount, {
    enabled: inView,
    duration: 1,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="relative"
    >
      <motion.article
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="glass-card relative overflow-hidden rounded-2xl p-6 text-white"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="mono-label !text-sky-light">Active Coverage</p>
            <h3 className="mt-2 font-serif text-3xl">Kavach AI</h3>
            <p className="mt-1 text-sm text-sky-light/80">Guardian live for {worker.zone}</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
            Active coverage
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="mono-label !text-sky-light/80">Zone Status</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="relative inline-flex h-3 w-3">
                <span className="absolute inset-0 rounded-full bg-k-red/80 animate-zone-pulse" />
                <span className="relative rounded-full bg-k-red h-3 w-3" />
              </span>
              <span className="font-semibold text-white">Heavy rain</span>
            </div>
            <p className="mt-2 text-sm text-sky-light/75">{activeAlert.condition}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="mono-label !text-sky-light/80">Payout</p>
            <p className="mt-3 font-serif text-4xl text-gold">
              {formatCurrency(Number(animatedAmount))}
            </p>
            <p className="mt-2 text-sm text-sky-light/75">Trust score {worker.trustScore}</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-light/80">
            <span>Claim pipeline</span>
            <span className="text-gold">Auto approved</span>
          </div>
          <div className="relative">
            <div className="absolute left-0 right-0 top-4 h-px bg-white/15" />
            <div className="absolute left-0 right-[5%] top-4 h-px bg-k-green" />
            <div className="relative grid grid-cols-3 gap-4">
              {['Verified', 'Processing', 'Paid ✓'].map((step) => (
                <div key={step} className="flex flex-col items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-k-green text-sm">
                    ✓
                  </span>
                  <span className="text-xs font-semibold text-white">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.article>

      <div className="absolute -right-4 -top-4 rounded-2xl border border-gold/20 bg-gold-light px-4 py-3 shadow-card">
        <p className="mono-label !text-gold">Instant credit</p>
        <p className="mt-1 font-serif text-2xl text-navy">{formatCurrency(activeAlert.payoutAmount)}</p>
      </div>
    </motion.div>
  )
}
