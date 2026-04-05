import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bell,
  HandCoins,
  Loader2,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../components/KpiCard'
import { StatusPill } from '../components/StatusPill'
import { ZoneMap } from '../components/ZoneMap'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { requestEmergencySupport, getPayoutReceipt, manageAutopay, simulatePayout, upgradePolicy } from '../utils/api'
import { downloadTextFile } from '../utils/download'
import { formatCurrency, formatPercent } from '../utils/format'

const planOrder = ['Basic', 'Standard', 'Pro'] as const

const sectionReveal = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' as const },
}

function parsePlanName(plan: string) {
  const normalized = plan.replace(/^Kavach\s+/i, '')
  return (planOrder.includes(normalized as (typeof planOrder)[number]) ? normalized : 'Standard') as (typeof planOrder)[number]
}

function nextPlan(plan: string) {
  const current = parsePlanName(plan)
  const index = planOrder.indexOf(current)
  return planOrder[Math.min(index + 1, planOrder.length - 1)]
}

export function DashboardPage() {
  const { user, token } = useAuth()
  const { data, refreshData } = useAppData()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'green' | 'gold' | 'red'>('green')

  if (!user || !data) {
    return null
  }

  const dashboard = data.dashboard
  const riskOutlook = dashboard.riskOutlook
  const payoutState = dashboard.payoutState
  const currentPlan = parsePlanName(user.plan)

  const actionLabel = (actionId: string) => {
    switch (actionId) {
      case 'support':
        return 'Request support'
      case 'receipt':
        return 'Download receipt'
      case 'autopay':
        return data.policy.autopayState.enabled ? 'Pause AutoPay' : 'Resume AutoPay'
      case 'upgrade':
        return currentPlan === 'Pro' ? 'Plan locked' : `Upgrade to Kavach ${nextPlan(user.plan)}`
      case 'payout':
        return 'Simulate payout'
      default:
        return 'Run action'
    }
  }

  const setFeedback = (tone: 'green' | 'gold' | 'red', message: string) => {
    setStatusTone(tone)
    setStatusMessage(message)
  }

  const downloadReceipt = async () => {
    const receipt = await getPayoutReceipt(token, payoutState.reference)
    downloadTextFile(receipt, `${payoutState.reference}.txt`)
  }

  const handleAction = async (actionId: string) => {
    setBusyAction(actionId)
    setStatusMessage(null)

    try {
      switch (actionId) {
        case 'support': {
          const response = await requestEmergencySupport(token, 'callback')
          setFeedback(
            'green',
            `Support queued. Ticket ${response.ticketId} will call back in about ${response.callbackEtaMinutes} minutes.`,
          )
          break
        }
        case 'receipt': {
          await downloadReceipt()
          setFeedback('green', 'Latest payout receipt downloaded.')
          break
        }
        case 'autopay': {
          const response = await manageAutopay(token, !data.policy.autopayState.enabled)
          await refreshData()
          setFeedback('gold', response.message)
          break
        }
        case 'upgrade': {
          if (currentPlan === 'Pro') {
            setFeedback('gold', 'You are already on the top plan.')
            break
          }

          const response = await upgradePolicy(token, nextPlan(user.plan))
          await refreshData()
          setFeedback('green', response.message)
          break
        }
        case 'payout': {
          const response = await simulatePayout(token, 'upi_mock')
          setFeedback('green', `${response.message} Reference ${response.payout.reference}.`)
          break
        }
        default:
          setFeedback('red', 'This action is not yet wired.')
      }
    } catch (error) {
      setFeedback('red', error instanceof Error ? error.message : 'Something went wrong while running that action.')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <motion.main {...pageTransition} className="section-shell space-y-8 pb-10">
      <motion.section {...sectionReveal} className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="space-y-5">
            <p className="mono-label">Worker dashboard</p>
            <h1 className="max-w-3xl font-serif text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.95] text-navy">
              Your protection layer is live.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted">
              Track earnings protected, weekly coverage, payout status, and the risk logic behind every automated decision.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/policy"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-navy-mid focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/20"
            >
              View policy
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/alerts"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-light bg-white px-5 text-sm font-semibold text-navy transition duration-200 hover:-translate-y-0.5 hover:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/20"
            >
              <Bell className="h-4 w-4" />
              Support and alerts
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Next deduction" value={user.nextDeduction} />
            <MiniStat label="KYC" value={user.kycVerified ? 'Verified' : 'Pending'} />
            <MiniStat label="Plan" value={user.plan} />
          </div>
        </div>

        <motion.section
          {...sectionReveal}
          transition={{ ...sectionReveal.transition, delay: 0.08 }}
          className="overflow-hidden rounded-[32px] border border-sky-light bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] shadow-card"
        >
          <div className="border-b border-white/10 px-6 py-5 text-white sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-sky-light/80">Live payout rail</p>
                <h2 className="mt-3 text-2xl font-serif text-white">{formatCurrency(payoutState.amount)}</h2>
              </div>
              <StatusPill status={payoutState.status}>{payoutState.status}</StatusPill>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-7 text-sky-light/80">{payoutState.rail}</p>
          </div>

          <div className="grid gap-3 px-6 py-6 sm:grid-cols-3 sm:px-7">
            <Metric label="Reference" value={payoutState.reference.replace('payout-', '').replace('-latest', '')} tone="soft" />
            <Metric label="Rail" value={payoutState.provider} tone="soft" />
            <Metric label="ETA" value={`${payoutState.etaMinutes} min`} tone="soft" />
          </div>

          <div className="grid gap-4 border-t border-white/10 px-6 py-6 sm:grid-cols-2 sm:px-7">
            <Metric label="Coverage window" value={`${riskOutlook.coverageHours} hrs`} />
            <Metric
              label="Premium drift"
              value={`${riskOutlook.premiumDelta >= 0 ? '+' : '-'}₹${Math.abs(riskOutlook.premiumDelta)}`}
            />
          </div>

          <div className="border-t border-white/10 px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-sky-light/70">Current posture</p>
                <p className="text-sm text-sky-light/80">{riskOutlook.summary}</p>
              </div>
              <StatusPill status={riskOutlook.level === 'low' ? 'safe' : riskOutlook.level === 'moderate' ? 'watch' : 'flagged'}>
                {riskOutlook.level}
              </StatusPill>
            </div>
          </div>
        </motion.section>
      </motion.section>

      <motion.section {...sectionReveal} transition={{ ...sectionReveal.transition, delay: 0.05 }}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((card) => (
            <KpiCard
              key={card.label}
              {...card}
            />
          ))}
        </div>
      </motion.section>

      <motion.section
        {...sectionReveal}
        transition={{ ...sectionReveal.transition, delay: 0.1 }}
        className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="panel-card p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mono-label">Action center</p>
              <h2 className="mt-2 text-2xl font-serif text-navy">Do something useful now</h2>
            </div>
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dashboard.quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                disabled={busyAction === action.id || (action.id === 'upgrade' && currentPlan === 'Pro')}
                onClick={() => void handleAction(action.id)}
                className="group flex w-full items-start justify-between gap-4 rounded-[24px] border border-sky-light bg-white px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-sky hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-navy">{actionLabel(action.id)}</div>
                  <p className="text-sm leading-6 text-muted">{action.description}</p>
                </div>
                {busyAction === action.id ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-sky" />
                ) : action.id === 'receipt' ? (
                  <ReceiptText className="mt-1 h-4 w-4 text-sky transition group-hover:translate-x-0.5" />
                ) : action.id === 'support' ? (
                  <ShieldAlert className="mt-1 h-4 w-4 text-sky transition group-hover:translate-x-0.5" />
                ) : action.id === 'autopay' ? (
                  <ShieldCheck className="mt-1 h-4 w-4 text-sky transition group-hover:translate-x-0.5" />
                ) : (
                  <HandCoins className="mt-1 h-4 w-4 text-sky transition group-hover:translate-x-0.5" />
                )}
                </button>
              ))}
            </div>

            {statusMessage ? (
            <div
              className={`mt-5 rounded-[24px] px-4 py-4 text-sm ${
                statusTone === 'green'
                  ? 'bg-[#E6F4EF] text-k-green'
                  : statusTone === 'gold'
                    ? 'bg-gold-light text-gold'
                    : 'bg-[#FDE8E8] text-k-red'
              }`}
            >
              {statusMessage}
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] bg-sky-pale/60 px-4 py-4 text-sm leading-7 text-muted">
              Quick actions use the live backend: support queues a callback, receipts download immediately, autopay toggles the
              mandate, and plan upgrades update your coverage.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ZoneMap {...dashboard.zoneMap} />

          <div className="panel-card p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mono-label">Protection explanation</p>
                <h2 className="mt-2 text-2xl font-serif text-navy">Why today is priced this way</h2>
              </div>
              <StatusPill status={riskOutlook.level === 'low' ? 'safe' : riskOutlook.level === 'moderate' ? 'watch' : 'flagged'}>
                {riskOutlook.level}
              </StatusPill>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">{riskOutlook.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Likely trigger" value={riskOutlook.nextLikelyTrigger} />
              <InfoTile label="Confidence" value={formatPercent(riskOutlook.confidence)} />
              <InfoTile label="Protected income" value={formatCurrency(riskOutlook.protectedAmount)} />
              <InfoTile label="Weekly premium" value={formatCurrency(user.weeklyPremium)} />
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...sectionReveal} transition={{ ...sectionReveal.transition, delay: 0.15 }}>
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <div className="panel-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mono-label">Trigger watchlist</p>
                <h2 className="mt-2 text-2xl font-serif text-navy">What Kavach is tracking now</h2>
              </div>
              <StatusPill status="active">{dashboard.triggerEvaluations.length} live</StatusPill>
            </div>
            <div className="mt-6 space-y-3">
              {dashboard.triggerEvaluations.map((trigger) => (
                <div
                  key={trigger.id}
                  className="rounded-[24px] border border-sky-light/70 bg-kavach px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-navy">{trigger.name}</div>
                      <p className="mt-1 text-sm leading-6 text-muted">{trigger.detail}</p>
                    </div>
                    <StatusPill status={trigger.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-muted">
                    <span>{trigger.source}</span>
                    <span>{trigger.probability}% probability</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mono-label">Recent payout activity</p>
                <h2 className="mt-2 text-2xl font-serif text-navy">Ledger</h2>
              </div>
              <StatusPill status={payoutState.status}>Latest payout</StatusPill>
            </div>
            <div className="mt-6 grid gap-3 md:hidden">
              {dashboard.payoutHistory.map((entry) => (
                <article key={`${entry.date}-${entry.type}`} className="rounded-[24px] bg-kavach px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-navy">{entry.disruption}</div>
                      <p className="mt-1 text-sm text-muted">
                        {entry.date} · {entry.zone}
                      </p>
                    </div>
                    <StatusPill status={entry.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">{entry.type}</span>
                    <span className={entry.amount > 0 ? 'font-semibold text-k-green' : 'font-semibold text-k-red'}>
                      {entry.amount > 0 ? formatCurrency(entry.amount) : `-${formatCurrency(Math.abs(entry.amount))}`}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="fine-scrollbar mt-6 hidden overflow-x-auto md:block">
              <div className="table-row-ledger border-b border-sky-light/80 bg-sky-pale/40 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                <span>Date</span>
                <span>Type</span>
                <span>Disruption</span>
                <span>Zone</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {dashboard.payoutHistory.map((entry) => (
                <div
                  key={`${entry.date}-${entry.type}`}
                  className="table-row-ledger border-b border-sky-light/60 last:border-b-0"
                >
                  <span className="text-sm text-muted">{entry.date}</span>
                  <span className="font-medium text-navy">{entry.type}</span>
                  <span className="text-sm text-muted">{entry.disruption}</span>
                  <span className="text-sm text-muted">{entry.zone}</span>
                  <span className={entry.amount > 0 ? 'font-semibold text-k-green' : 'font-semibold text-k-red'}>
                    {entry.amount > 0 ? formatCurrency(entry.amount) : `-${formatCurrency(Math.abs(entry.amount))}`}
                  </span>
                  <StatusPill status={entry.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </motion.main>
  )
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'soft'
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone === 'soft' ? 'border-white/10 bg-white/5' : 'border-sky-light bg-white'}`}>
      <p className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${tone === 'soft' ? 'text-sky-light/70' : 'text-muted'}`}>
        {label}
      </p>
      <div className={`mt-2 text-base font-semibold ${tone === 'soft' ? 'text-white' : 'text-navy'}`}>{value}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-sky-light bg-white px-4 py-4 shadow-card">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-2 text-sm font-semibold text-navy">{value}</div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-kavach px-4 py-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-2 text-lg font-semibold text-navy">{value}</div>
    </div>
  )
}
