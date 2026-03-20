import { motion } from 'framer-motion'
import { Download, ShieldCheck } from 'lucide-react'
import { StatusPill } from '../components/StatusPill'
import { TrustScoreGauge } from '../components/TrustScoreGauge'
import { useAuth } from '../context/AuthContext'
import { activeAlert, payoutHistory, premiumHistory, verificationSignals, worker } from '../data/mockData'
import { pageTransition } from '../lib/motion'
import { formatCurrency } from '../utils/format'

export function ClaimsPage() {
  const { user } = useAuth()
  const profile = user ?? worker
  const claimsPayoutHistory = payoutHistory.filter((entry) => entry.amount > 0)

  return (
    <motion.div
      {...pageTransition}
      className="section-shell space-y-8 pb-10"
    >
      <div>
        <p className="mono-label">Claims</p>
        <h1 className="mt-3 font-serif text-[clamp(2.3rem,5vw,4rem)] text-navy">Claim Center</h1>
        <p className="mt-3 text-base leading-7 text-muted">
          Automated parametric payouts for active disruptions in your coverage zone.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusPill
              status="triggered"
              className="bg-rose-500/10 text-rose-100"
            >
              🔴 Active Parametric Trigger
            </StatusPill>
            <span className="text-sm text-sky-light/70">{activeAlert.triggeredAt}</span>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-start">
            <div className="text-6xl">{activeAlert.emoji}</div>
            <div>
              <h2 className="font-serif text-4xl leading-tight text-white">
                {activeAlert.type} Alert — {activeAlert.zone}
              </h2>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-light/60">
                {activeAlert.condition}
              </p>
              <p className="mt-3 text-sm text-sky-light/75">Sent to UPI ID {profile.upi}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
              <p className="mono-label !text-sky-light">Payout</p>
              <div className="mt-2 font-serif text-5xl text-gold">{formatCurrency(activeAlert.payoutAmount)}</div>
              <p className="mt-2 text-sm text-sky-light/70">{activeAlert.paidAt}</p>
            </div>
          </div>
          <div className="mt-10">
            <div className="mb-3 flex justify-between text-[11px] font-mono uppercase tracking-[0.18em] text-sky-light/55">
              <span>Trigger verified</span>
              <span>Fraud check</span>
              <span>Paid</span>
            </div>
            <div className="relative h-2 rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 w-full rounded-full bg-k-green" />
              <div className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-4 border-navy bg-k-green" />
              <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-navy bg-k-green" />
              <div className="absolute right-0 top-1/2 h-5 w-5 translate-y-[-50%] rounded-full border-4 border-navy bg-k-green" />
            </div>
          </div>
        </div>

        <div className="panel-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">AI trust score</p>
              <h2 className="mt-2 text-2xl font-serif text-navy">Auto approval</h2>
            </div>
            <StatusPill status="paid">Excellent</StatusPill>
          </div>
          <div className="mt-6 flex justify-center">
            <TrustScoreGauge score={profile.trustScore} />
          </div>
          <div className="mt-3 text-center">
            <div className="font-serif text-5xl text-navy">{profile.trustScore}</div>
            <p className="mt-2 text-sm font-semibold text-k-green">Excellent · Auto-approved</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {verificationSignals.map((signal) => (
              <div
                key={signal}
                className="rounded-full bg-sky-pale px-4 py-3 text-sm font-medium text-navy"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="table-shell">
          <div className="flex items-center justify-between border-b border-sky-light px-5 py-5">
            <div>
              <p className="mono-label">Payout history</p>
              <h2 className="mt-2 text-2xl font-serif text-navy">Settled claims</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-sky-light px-4 py-2 text-sm font-medium text-navy"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
          <div className="fine-scrollbar overflow-x-auto">
            <div className="grid min-w-[660px] grid-cols-[1.2fr_1fr_1.2fr_0.8fr] gap-4 border-b border-sky-light/80 bg-sky-pale/40 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              <span>Event type</span>
              <span>Date</span>
              <span>Location</span>
              <span>Amount</span>
            </div>
            {claimsPayoutHistory.map((entry) => (
              <div
                key={`${entry.disruption}-${entry.date}`}
                className="grid min-w-[660px] grid-cols-[1.2fr_1fr_1.2fr_0.8fr] gap-4 border-b border-sky-light/60 px-5 py-4 last:border-b-0"
              >
                <span className="font-medium text-navy">{entry.disruption}</span>
                <span className="text-sm text-muted">{entry.date}</span>
                <span className="text-sm text-muted">{entry.zone}</span>
                <span className="font-semibold text-gold">{formatCurrency(entry.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mono-label">Premium history</p>
              <h2 className="mt-2 text-2xl font-serif text-navy">Weekly autopay</h2>
            </div>
            <StatusPill status="active">AutoPay</StatusPill>
          </div>
          <div className="mt-6 space-y-4">
            {premiumHistory.map((premium) => (
              <div
                key={premium.cycle}
                className="rounded-[24px] bg-sky-pale/55 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{premium.cycle}</p>
                    <p className="mt-1 text-sm text-muted">Paid {premium.paidOn}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-navy">{formatCurrency(premium.amount)}</p>
                    <p className="mt-1 text-xs text-muted">{premium.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            Manage AutoPay
          </button>
        </div>
      </div>
    </motion.div>
  )
}
