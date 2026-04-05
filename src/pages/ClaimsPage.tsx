import { motion } from 'framer-motion'
import { Download, Loader2, Share2, ShieldCheck, ShieldQuestion, Smartphone } from 'lucide-react'
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

type TimelineItem = {
  title: string
  description: string
  time: string
  status: 'info' | 'watch' | 'success' | 'warning' | 'critical'
}

export function ClaimsPage() {
  const { user, token } = useAuth()
  const { data, refreshData } = useAppData()
  const [busy, setBusy] = useState<null | 'receipt' | 'autopay' | 'share'>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (!user || !data) {
    return null
  }

  const claims = data.claims
  const claimsPayoutHistory = claims.payoutHistory.filter((entry) => entry.amount > 0)
  const latestPayout = claims.payoutState
  const supportTicket = claims.supportTicket ?? data.alerts.latestTicket ?? null
  const receiptLabel = claims.latestReceipt?.shareLabel ?? latestPayout.reference
  const receiptPath = claims.latestReceipt?.downloadPath ?? latestPayout.reference

  const timeline: TimelineItem[] = (claims.timeline?.length
    ? claims.timeline.map((entry) => ({
        title: entry.title,
        description: entry.description,
        time: entry.createdAt,
        status: entry.status,
      }))
    : [
        {
          title: 'Trigger verified',
          description: `${claims.activeAlert.type} conditions crossed the payout threshold in ${claims.activeAlert.zone}.`,
          time: claims.activeAlert.triggeredAt,
          status: 'critical',
        },
        {
          title: 'Fraud checks cleared',
          description: `Trust score ${user.trustScore} kept the payout on the automated rail.`,
          time: 'Immediately after verification',
          status: 'success',
        },
        {
          title: 'Settlement sent',
          description: `${formatCurrency(claims.activeAlert.payoutAmount)} was sent to ${user.upi}.`,
          time: claims.activeAlert.paidAt,
          status: 'success',
        },
      ]) as TimelineItem[]

  const handleReceiptDownload = async () => {
    setBusy('receipt')
    setStatusMessage(null)

    try {
      const receipt = await getPayoutReceipt(token, receiptPath)
      downloadTextFile(receipt, `${latestPayout.reference}.txt`)
      setStatusMessage('Receipt downloaded from the live backend.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to fetch receipt right now.')
    } finally {
      setBusy(null)
    }
  }

  const handleShareReceipt = async () => {
    setBusy('share')
    setStatusMessage(null)

    const shareText = [
      `Kavach payout summary`,
      `Reference: ${receiptLabel}`,
      `Amount: ${formatCurrency(latestPayout.amount)}`,
      `Status: ${latestPayout.status}`,
      `Support reference: ${supportTicket?.ticketId ?? 'none open'}`,
    ].join('\n')

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Kavach payout summary',
          text: shareText,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
        setStatusMessage('Payout summary copied to your clipboard.')
      } else {
        setStatusMessage('Sharing is not available in this browser.')
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to share payout summary right now.')
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
    <motion.section
      {...pageTransition}
      className="section-shell space-y-8 pb-10 overflow-x-hidden"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <p className="mono-label">Claims</p>
          <h1 className="font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] text-navy">Claim Center</h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Automated parametric payouts, live receipt retrieval, and support follow-up in one mobile-safe workflow.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => void handleReceiptDownload()}
              disabled={busy === 'receipt'}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {busy === 'receipt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download receipt
            </button>
            <button
              type="button"
              onClick={() => void handleShareReceipt()}
              disabled={busy === 'share'}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-sky-light bg-white px-5 text-sm font-semibold text-navy transition hover:border-sky disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {busy === 'share' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Share summary
            </button>
            <Link
              to="/alerts"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-sky-light bg-white px-5 text-sm font-semibold text-navy transition hover:border-sky sm:w-auto"
            >
              <ShieldQuestion className="h-4 w-4" />
              Support
            </Link>
          </div>
        </div>

        <div className="panel-card overflow-hidden p-0">
          <div className="bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] px-6 py-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mono-label !text-sky-light">Latest payout</p>
                <h2 className="mt-2 text-2xl font-serif text-white">{formatCurrency(latestPayout.amount)}</h2>
              </div>
              <StatusPill status={latestPayout.status}>{latestPayout.status}</StatusPill>
            </div>
            <p className="mt-4 break-words text-sm leading-7 text-sky-light/80">{latestPayout.reference}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Provider" value={latestPayout.provider} />
              <MiniStat label="Rail" value={latestPayout.rail} />
              <MiniStat label="ETA" value={`${latestPayout.etaMinutes} min`} />
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-[24px] bg-sky-pale/60 p-4">
              <p className="mono-label">Receipt info</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {receiptLabel} · download path is backed by the live backend when available.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-navy">
                <span className="rounded-full bg-white px-3 py-1">{receiptLabel}</span>
                <span className="rounded-full bg-white px-3 py-1">{formatCurrency(latestPayout.amount)}</span>
              </div>
            </div>
            <div className="rounded-[24px] bg-sky-pale/60 p-4">
              <p className="mono-label">Support ticket</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {supportTicket
                  ? `Ticket ${supportTicket.ticketId} is ${supportTicket.status}. ETA ${supportTicket.callbackEtaMinutes} min.`
                  : 'No open ticket. Open support if you need help with the payout or policy.'}
              </p>
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
        <SummaryCard
          label="Weekly premium"
          value={formatCurrency(user.weeklyPremium)}
          hint="Auto-debited from the live mandate when enabled."
        />
        <SummaryCard
          label="Payout status"
          value={latestPayout.status}
          hint={`Reference ${latestPayout.reference}`}
          inverse
        />
        <SummaryCard
          label="Trust score"
          value={String(user.trustScore)}
          hint="Signals stay transparent before payout release."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mono-label">Claim timeline</p>
              <h2 className="mt-2 text-3xl font-serif text-navy">From trigger to settlement</h2>
            </div>
            <StatusPill status="triggered">Active parametric trigger</StatusPill>
          </div>
          <div className="mt-6 space-y-4">
            {timeline.map((step) => (
              <div
                key={`${step.title}-${step.time}`}
                className="relative rounded-[24px] border border-sky-light bg-kavach px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-navy">{step.title}</div>
                    <p className="mt-2 text-sm leading-7 text-muted">{step.description}</p>
                  </div>
                  <StatusPill status={step.status} />
                </div>
                <div className="mt-3 text-xs font-mono uppercase tracking-[0.18em] text-muted">{step.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">AI trust score</p>
              <h2 className="mt-2 text-2xl font-serif text-navy">Auto approval</h2>
            </div>
            <StatusPill
              status={claims.fraudAssessment.status === 'clear' ? 'safe' : claims.fraudAssessment.status === 'watch' ? 'watch' : 'flagged'}
            >
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
          <div className="mt-6 rounded-[24px] bg-sky-pale/60 p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-sky" />
              <p className="text-sm font-semibold text-navy">Need another copy?</p>
            </div>
            <p className="mt-2 text-sm leading-7 text-muted">
              Download the receipt, then share the reference with support or keep it for your records.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mono-label">Payout history</p>
              <h2 className="mt-2 text-2xl font-serif text-navy">Settled claims</h2>
            </div>
            <button
              type="button"
              onClick={() => void handleReceiptDownload()}
              disabled={busy === 'receipt'}
              className="inline-flex items-center gap-2 rounded-full border border-sky-light px-4 py-2 text-sm font-medium text-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'receipt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download receipt
            </button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {claimsPayoutHistory.map((entry, index) => (
              <article
                key={`${entry.disruption}-${entry.date}`}
                className="rounded-[24px] border border-sky-light bg-kavach px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-navy">{entry.disruption}</div>
                    <p className="mt-1 text-sm text-muted">
                      {entry.date} · {entry.zone}
                    </p>
                  </div>
                  <StatusPill status={index === 0 ? 'paid' : entry.status === 'Paid' ? 'paid' : 'pending'}>
                    {entry.status}
                  </StatusPill>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-muted">Event type</div>
                  <div className="font-semibold text-navy">{entry.type}</div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-sky-light pt-3">
                  <div className="text-sm text-muted">Amount</div>
                  <div className="font-semibold text-k-green">{formatCurrency(entry.amount)}</div>
                </div>
              </article>
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
                className="rounded-[24px] bg-kavach px-4 py-4"
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
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'autopay' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {data.policy.autopayState.enabled ? 'Pause AutoPay' : 'Resume AutoPay'}
          </button>
        </div>
      </div>
    </motion.section>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  inverse = false,
}: {
  label: string
  value: string
  hint: string
  inverse?: boolean
}) {
  return (
    <div className={inverse ? 'panel-card bg-navy p-5 text-white' : 'panel-card p-5'}>
      <p className={inverse ? 'mono-label !text-sky-light' : 'mono-label'}>{label}</p>
      <div className={inverse ? 'mt-3 font-serif text-4xl text-gold' : 'mt-3 font-serif text-4xl text-navy'}>
        {value}
      </div>
      <p className={inverse ? 'mt-3 text-sm text-sky-light/75' : 'mt-3 text-sm text-muted'}>{hint}</p>
    </div>
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
