import { motion } from 'framer-motion'
import { Download, ShieldCheck, ShieldQuestion, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { StatusPill } from '../components/StatusPill'
import { TrustScoreGauge } from '../components/TrustScoreGauge'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { getPayoutReceipt, manageAutopay } from '../utils/api'
import { downloadTextFile } from '../utils/download'
import { formatCurrency } from '../utils/format'

export function ClaimsPage() {
  const { user, token } = useAuth()
  const { data, refreshData } = useAppData()
  const [busy, setBusy] = useState<null | 'receipt' | 'autopay'>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (!user || !data) {
    return null
  }

  const claims = data.claims
  const claimsPayoutHistory = claims.payoutHistory.filter((entry) => entry.amount > 0)
  const latestPayout = claims.payoutState

  const handleReceiptDownload = async () => {
    setBusy('receipt')
    setStatusMessage(null)

    try {
      const receipt = await getPayoutReceipt(token, latestPayout.reference)
      downloadTextFile(receipt, `${latestPayout.reference}.txt`)
      setStatusMessage('Receipt downloaded from the live backend.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to fetch receipt right now.')
    } finally {
      setBusy(null)
    }
  }

  const handleAutopayToggle = async () => {
    setBusy('autopay')
    setStatusMessage(null)

    try {
      const response = await manageAutopay(token, !data.policy.autopayState.enabled)
      await refreshData()
      setStatusMessage(response.message)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to update AutoPay right now.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <motion.div
      {...pageTransition}
      className="section-shell space-y-8 pb-10"
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mono-label">Claims</p>
          <h1 className="mt-3 font-serif text-[clamp(2.3rem,5vw,4rem)] text-navy">Claim Center</h1>
          <p className="mt-3 text-base leading-7 text-muted">
            Automated parametric payouts, live receipt retrieval, and AutoPay control for the active coverage cycle.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleReceiptDownload()}
              disabled={busy === 'receipt'}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'receipt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download receipt
            </button>
            <Link
              to="/alerts"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-light bg-white px-5 text-sm font-semibold text-navy transition hover:border-sky"
            >
              <ShieldQuestion className="h-4 w-4" />
              Support
            </Link>
          </div>
        </div>

        <div className="panel-card overflow-hidden p-0">
          <div className="bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] px-6 py-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mono-label !text-sky-light">Latest payout</p>
                <h2 className="mt-2 text-2xl font-serif text-white">{formatCurrency(latestPayout.amount)}</h2>
              </div>
              <StatusPill status={latestPayout.status}>{latestPayout.status}</StatusPill>
            </div>
            <p className="mt-4 text-sm leading-7 text-sky-light/80">{latestPayout.reference}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Provider" value={latestPayout.provider} />
              <MiniStat label="Rail" value={latestPayout.rail} />
              <MiniStat label="ETA" value={`${latestPayout.etaMinutes} min`} />
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-[24px] bg-sky-pale/60 p-4">
              <p className="mono-label">Verification trail</p>
              <p className="mt-3 text-sm leading-7 text-muted">{claims.fraudAssessment.summary}</p>
            </div>
            <div className="rounded-[24px] bg-sky-pale/60 p-4">
              <p className="mono-label">AutoPay</p>
              <p className="mt-3 text-sm leading-7 text-muted">{data.policy.autopayState.note}</p>
            </div>
          </div>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-2xl border border-sky-light bg-white px-4 py-3 text-sm text-muted shadow-card">
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel-card p-5">
          <p className="mono-label">Weekly premium</p>
          <div className="mt-3 font-serif text-4xl text-navy">{formatCurrency(user.weeklyPremium)}</div>
          <p className="mt-3 text-sm text-muted">Auto-debited from the live mandate when enabled.</p>
        </div>
        <div className="panel-card bg-navy p-5 text-white">
          <p className="mono-label !text-sky-light">Payout status</p>
          <div className="mt-3 font-serif text-4xl text-gold">{latestPayout.status}</div>
          <p className="mt-3 text-sm text-sky-light/75">Reference {latestPayout.reference}</p>
        </div>
        <div className="panel-card p-5">
          <p className="mono-label">Trust score</p>
          <div className="mt-3 font-serif text-4xl text-navy">{user.trustScore}</div>
          <p className="mt-3 text-sm text-muted">Signals stay transparent before payout release.</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusPill
              status="triggered"
              className="bg-rose-500/10 text-rose-100"
            >
              Active parametric trigger
            </StatusPill>
            <span className="text-sm text-sky-light/70">{claims.activeAlert.triggeredAt}</span>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-start">
            <div className="text-6xl">{claims.activeAlert.emoji}</div>
            <div>
              <h2 className="font-serif text-4xl leading-tight text-white">
                {claims.activeAlert.type} Alert - {claims.activeAlert.zone}
              </h2>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-light/60">
                {claims.activeAlert.condition}
              </p>
              <p className="mt-3 text-sm text-sky-light/75">Sent to UPI ID {user.upi}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
              <p className="mono-label !text-sky-light">Settlement</p>
              <div className="mt-2 font-serif text-5xl text-gold">{formatCurrency(claims.activeAlert.payoutAmount)}</div>
              <p className="mt-2 text-sm text-sky-light/70">{claims.activeAlert.paidAt}</p>
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
            <StatusPill status={claims.fraudAssessment.status === 'clear' ? 'safe' : claims.fraudAssessment.status === 'watch' ? 'watch' : 'flagged'}>
              {claims.fraudAssessment.status}
            </StatusPill>
          </div>
          <div className="mt-6 flex justify-center">
            <TrustScoreGauge score={user.trustScore} />
          </div>
          <div className="mt-3 text-center">
            <div className="font-serif text-5xl text-navy">{user.trustScore}</div>
            <p className="mt-2 text-sm font-semibold text-k-green">Transparent and auto-approved</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {claims.verificationSignals.map((signal) => (
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
              onClick={() => void handleReceiptDownload()}
              disabled={busy === 'receipt'}
              className="inline-flex items-center gap-2 rounded-full border border-sky-light px-4 py-2 text-sm font-medium text-navy"
            >
              {busy === 'receipt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download receipt
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
            <StatusPill status={data.policy.autopayState.enabled ? 'active' : 'watch'}>
              {data.policy.autopayState.mandateStatus}
            </StatusPill>
          </div>
          <div className="mt-4 rounded-[24px] bg-sky-pale/55 p-4">
            <p className="text-sm leading-7 text-muted">{data.policy.autopayState.note}</p>
            <p className="mt-3 text-sm font-medium text-navy">Next charge: {data.policy.autopayState.nextCharge}</p>
          </div>
          <div className="mt-6 space-y-4">
            {claims.premiumHistory.map((premium) => (
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
            onClick={() => void handleAutopayToggle()}
            disabled={busy === 'autopay'}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white"
          >
            {busy === 'autopay' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {data.policy.autopayState.enabled ? 'Pause AutoPay' : 'Resume AutoPay'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-light/70">{label}</p>
      <div className="mt-2 text-base font-semibold text-white">{value}</div>
    </div>
  )
}
