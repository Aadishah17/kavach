import { motion } from 'framer-motion'
import { ArrowRight, Download, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { getPayoutReceipt, manageAutopay, upgradePolicy } from '../utils/api'
import { downloadTextFile } from '../utils/download'
import { formatCurrency } from '../utils/format'

const planOrder = ['Basic', 'Standard', 'Pro'] as const

function stripPlanName(plan: string) {
  return plan.replace(/^Kavach\s+/i, '')
}

export function PolicyPage() {
  const { user, token } = useAuth()
  const { data, refreshData } = useAppData()
  const [busy, setBusy] = useState<null | 'receipt' | 'autopay' | 'upgrade-basic' | 'upgrade-standard' | 'upgrade-pro'>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (!user || !data) {
    return null
  }

  const policy = data.policy
  const currentPlan = stripPlanName(user.plan) as (typeof planOrder)[number]
  const latestReceiptReference = data.claims.payoutState.reference

  const downloadReceipt = async () => {
    setBusy('receipt')
    setStatusMessage(null)

    try {
      const receipt = await getPayoutReceipt(token, latestReceiptReference)
      downloadTextFile(receipt, `${latestReceiptReference}.txt`)
      setStatusMessage('Receipt downloaded from the backend.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not fetch receipt right now.')
    } finally {
      setBusy(null)
    }
  }

  const toggleAutopay = async () => {
    setBusy('autopay')
    setStatusMessage(null)

    try {
      const response = await manageAutopay(token, !policy.autopayState.enabled)
      await refreshData()
      setStatusMessage(response.message)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not update AutoPay right now.')
    } finally {
      setBusy(null)
    }
  }

  const upgradeTo = async (plan: (typeof planOrder)[number]) => {
    setBusy(`upgrade-${plan.toLowerCase()}` as typeof busy)
    setStatusMessage(null)

    try {
      const response = await upgradePolicy(token, plan)
      await refreshData()
      setStatusMessage(response.message)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not upgrade your plan right now.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <motion.section
      {...pageTransition}
      className="space-y-8 pb-4 overflow-x-hidden"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono-label">Policy details</p>
          <h1 className="mt-3 text-[44px] leading-none">{user.plan}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Dynamic premium, autopay controls, and upgrade paths are all backed by the live backend contract.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={policy.dynamicPremium.level === 'low' ? 'safe' : policy.dynamicPremium.level === 'moderate' ? 'watch' : 'flagged'}>
            {policy.dynamicPremium.level}
          </StatusPill>
          <button
            type="button"
            onClick={() => void downloadReceipt()}
            disabled={busy === 'receipt'}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy === 'receipt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download receipt
          </button>
        </div>
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-sky-light bg-white px-4 py-3 text-sm text-muted shadow-card">
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <SummaryCard label="Weekly premium" value={formatCurrency(user.weeklyPremium)} hint="Every Monday" />
        <SummaryCard label="Insured income" value={formatCurrency(user.iwi)} hint="Weekly cap" />
        <SummaryCard label="Trust score" value={String(user.trustScore)} hint="Auto-approved" />
        <SummaryCard label="Next deduction" value={policy.autopayState.nextCharge} hint={policy.autopayState.mandateStatus} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel-card p-6">
          <p className="mono-label">Policy overview</p>
          <h2 className="mt-2 text-3xl">What your cover includes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {policy.coverage.map((item) => (
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
          <div className="flex items-center justify-between">
            <div>
              <p className="mono-label">Dynamic premium</p>
              <h2 className="mt-2 text-3xl">Why your price moves</h2>
            </div>
            <StatusPill status={policy.dynamicPremium.level === 'low' ? 'safe' : policy.dynamicPremium.level === 'moderate' ? 'watch' : 'flagged'}>
              {policy.dynamicPremium.level}
            </StatusPill>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">{policy.dynamicPremium.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Likely trigger" value={policy.dynamicPremium.nextLikelyTrigger} />
            <InfoCard label="Coverage hours" value={`${policy.dynamicPremium.coverageHours} hrs`} />
            <InfoCard label="Protected amount" value={formatCurrency(policy.dynamicPremium.protectedAmount)} />
            <InfoCard label="Premium delta" value={`${policy.dynamicPremium.premiumDelta >= 0 ? '+' : '-'}₹${Math.abs(policy.dynamicPremium.premiumDelta)}`} />
          </div>
        </div>
      </section>

      <section id="autopay" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mono-label">AutoPay</p>
              <h2 className="mt-2 text-3xl">Mandate control</h2>
            </div>
            <StatusPill status={policy.autopayState.enabled ? 'active' : 'watch'}>
              {policy.autopayState.mandateStatus}
            </StatusPill>
          </div>
          <div className="mt-5 rounded-[24px] bg-sky-pale/60 p-4">
            <p className="text-sm leading-7 text-muted">{policy.autopayState.note}</p>
            <p className="mt-3 text-sm font-medium text-navy">Next charge: {policy.autopayState.nextCharge}</p>
          </div>
          <button
            type="button"
            onClick={() => void toggleAutopay()}
            disabled={busy === 'autopay'}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'autopay' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {policy.autopayState.enabled ? 'Pause AutoPay' : 'Resume AutoPay'}
          </button>
          <Link
            to="/alerts"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-light bg-white px-5 py-3 text-sm font-semibold text-navy transition hover:border-sky"
          >
            <Sparkles className="h-4 w-4" />
            Open support
          </Link>
        </div>

        <div className="panel-card p-6" id="upgrade">
          <div className="flex items-center justify-between">
            <div>
              <p className="mono-label">Plan upgrade</p>
              <h2 className="mt-2 text-3xl">Move up when your route changes</h2>
            </div>
            <StatusPill status="paid">{currentPlan}</StatusPill>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">
            Current plan: {user.plan}. Upgrade buttons hit the live policy endpoint and then refresh the session.
          </p>
          <div className="mt-6 space-y-4">
            {planOrder.map((plan) => {
              const isCurrent = plan === currentPlan
              const isTop = plan === 'Pro'

              return (
                <div
                  key={plan}
                  className="rounded-[24px] bg-kavach px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-navy">Kavach {plan}</div>
                      <div className="mt-1 text-sm text-muted">
                        {plan === 'Basic' ? '3 trigger categories' : plan === 'Standard' ? '7 trigger categories' : 'Family backup wallet + concierge'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent || busy === `upgrade-${plan.toLowerCase()}`}
                      onClick={() => void upgradeTo(plan)}
                      className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-sky-light"
                    >
                      {busy === `upgrade-${plan.toLowerCase()}` ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? 'Current plan' : isTop && currentPlan === 'Pro' ? 'Top tier' : 'Upgrade'}
                      {!isCurrent ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="table-shell">
        <div className="flex items-center justify-between border-b border-sky-light px-5 py-5">
          <div>
            <p className="mono-label">Premium history</p>
            <h2 className="mt-2 text-3xl">Mandate schedule</h2>
          </div>
          <StatusPill status="active">Live receipt</StatusPill>
        </div>
        <div className="grid gap-3 p-5 md:hidden">
          {policy.premiumHistory.map((item) => (
            <article key={item.cycle} className="rounded-[24px] bg-kavach px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-navy">{item.cycle}</div>
                  <p className="mt-1 text-sm text-muted">{item.paidOn}</p>
                </div>
                <div className="text-right font-semibold text-navy">{formatCurrency(item.amount)}</div>
              </div>
              <p className="mt-3 text-sm text-muted">{item.note}</p>
            </article>
          ))}
        </div>
        <div className="hidden md:block">
          {policy.premiumHistory.map((item) => (
            <div
              key={item.cycle}
              className="grid min-w-[640px] grid-cols-[1fr_1fr_1fr] gap-4 border-b border-sky-light px-5 py-4 text-sm last:border-b-0"
            >
              <div className="font-semibold text-navy">{item.cycle}</div>
              <div className="text-muted">{item.paidOn}</div>
              <div className="text-right font-semibold text-navy">{formatCurrency(item.amount)}</div>
            </div>
          ))}
        </div>
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-kavach px-4 py-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-2 text-lg font-semibold text-navy">{value}</div>
    </div>
  )
}
