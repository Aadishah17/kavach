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
  const fraudAssessment = dashboard.fraudAssessment
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
          const currentPlan = parsePlanName(user.plan)
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
    <motion.div
      {...pageTransition}
      className="section-shell space-y-8 pb-10"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mono-label">Worker dashboard</p>
          <h1 className="mt-3 font-serif text-[clamp(2.4rem,5vw,4.4rem)] text-navy">Your protection layer is live.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Track earnings protected, weekly coverage, payout status, and the risk logic behind every automated decision.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/policy"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid"
            >
              View policy
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/alerts"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-sky-light bg-white px-5 text-sm font-semibold text-navy transition hover:border-sky"
            >
              <Bell className="h-4 w-4" />
              Support and alerts
            </Link>
          </div>
        </div>

        <div className="panel-card overflow-hidden p-0">
          <div className="bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono-label !text-sky-light">Payout status</p>
                <h2 className="mt-2 text-2xl font-serif text-white">{formatCurrency(payoutState.amount)}</h2>
              </div>
              <StatusPill status={payoutState.status}>{payoutState.status}</StatusPill>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-7 text-sky-light/80">{payoutState.rail}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Reference" value={payoutState.reference.replace('payout-', '').replace('-latest', '')} />
              <Metric label="Rail" value={payoutState.provider} />
              <Metric label="ETA" value={`${payoutState.etaMinutes} min`} />
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-[24px] bg-sky-pale/60 p-4">
              <p className="mono-label">Coverage window</p>
              <div className="mt-3 text-3xl font-serif text-navy">{riskOutlook.coverageHours} hrs</div>
              <p className="mt-2 text-sm text-muted">Protected for {riskOutlook.nextLikelyTrigger} windows.</p>
            </div>
            <div className="rounded-[24px] bg-sky-pale/60 p-4">
              <p className="mono-label">Dynamic premium</p>
              <div className="mt-3 text-3xl font-serif text-navy">
                {riskOutlook.premiumDelta >= 0 ? '+' : '-'}₹{Math.abs(riskOutlook.premiumDelta)}
              </div>
              <p className="mt-2 text-sm text-muted">{riskOutlook.summary}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.kpis.map((card) => (
          <KpiCard
            key={card.label}
            {...card}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ZoneMap {...dashboard.zoneMap} />

        <div className="space-y-6">
          <section className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono-label">Coverage explanation</p>
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
          </section>

          <section className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono-label">Fraud transparency</p>
                <h2 className="mt-2 text-2xl font-serif text-navy">Signals behind auto-approval</h2>
              </div>
              <StatusPill
                status={fraudAssessment.status === 'clear' ? 'safe' : fraudAssessment.status === 'watch' ? 'watch' : 'flagged'}
              >
                {fraudAssessment.status}
              </StatusPill>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">{fraudAssessment.summary}</p>
            <div className="mt-5 space-y-4">
              {fraudAssessment.signals.map((signal) => (
                <div key={signal.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-navy">{signal.label}</span>
                    <span className="font-semibold text-muted">{signal.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-sky-pale">
                    <div
                      className={`h-full rounded-full ${
                        signal.status === 'clear' ? 'bg-k-green' : signal.status === 'watch' ? 'bg-gold' : 'bg-k-red'
                      }`}
                      style={{ width: `${signal.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">{signal.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="panel-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">Trigger watchlist</p>
              <h2 className="mt-2 text-3xl font-serif text-navy">What Kavach is tracking now</h2>
            </div>
            <StatusPill status="active">{dashboard.triggerEvaluations.length} live</StatusPill>
          </div>
          <div className="mt-6 space-y-3">
            {dashboard.triggerEvaluations.map((trigger) => (
              <div
                key={trigger.id}
                className="rounded-[24px] bg-kavach px-4 py-4"
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

        <div className="panel-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">Quick actions</p>
              <h2 className="mt-2 text-3xl font-serif text-navy">Do something useful now</h2>
            </div>
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <div className="mt-6 space-y-3">
            {dashboard.quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={busyAction === action.id || (action.id === 'upgrade' && currentPlan === 'Pro')}
                onClick={() => void handleAction(action.id)}
                className="flex w-full items-start justify-between gap-4 rounded-[24px] border border-sky-light bg-white px-4 py-4 text-left transition hover:border-sky disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div>
                  <div className="font-semibold text-navy">{actionLabel(action.id)}</div>
                  <p className="mt-1 text-sm leading-6 text-muted">{action.description}</p>
                </div>
                {busyAction === action.id ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-sky" />
                ) : action.id === 'receipt' ? (
                  <ReceiptText className="mt-1 h-4 w-4 text-sky" />
                ) : action.id === 'support' ? (
                  <ShieldAlert className="mt-1 h-4 w-4 text-sky" />
                ) : action.id === 'autopay' ? (
                  <ShieldCheck className="mt-1 h-4 w-4 text-sky" />
                ) : (
                  <HandCoins className="mt-1 h-4 w-4 text-sky" />
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
            <div className="mt-5 rounded-[24px] bg-sky-pale/60 px-4 py-4 text-sm text-muted">
              Quick actions use the live backend: support queues a callback, receipts download immediately,
              autopay toggles the mandate, and plan upgrades update your coverage.
            </div>
          )}
        </div>
      </section>

      <div className="table-shell">
        <div className="flex items-center justify-between border-b border-sky-light px-5 py-5">
          <div>
            <p className="mono-label">Recent payout activity</p>
            <h2 className="mt-2 text-2xl font-serif text-navy">Ledger</h2>
          </div>
          <StatusPill status={payoutState.status}>Latest payout</StatusPill>
        </div>
        <div className="grid gap-3 p-5 md:hidden">
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
        <div className="fine-scrollbar hidden overflow-x-auto md:block">
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
    </motion.div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-light/70">{label}</p>
      <div className="mt-2 text-base font-semibold text-white">{value}</div>
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
