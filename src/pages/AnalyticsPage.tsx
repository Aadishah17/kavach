import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { type ReactNode, useState } from 'react'
import { Download, Loader2, TrendingUp, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../components/KpiCard'
import { StatusPill } from '../components/StatusPill'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../lib/motion'
import { exportAnalytics } from '../utils/api'
import { downloadTextFile } from '../utils/download'
import { formatCompactCurrency, formatCurrency, formatLakhs, formatPercent } from '../utils/format'

function queueTone(status: string) {
  if (status === 'review') {
    return 'flagged'
  }

  if (status === 'watch') {
    return 'watch'
  }

  return 'safe'
}

function payoutTone(status: string) {
  if (status === 'processing') {
    return 'processing'
  }

  if (status === 'manual_review' || status === 'failed') {
    return 'flagged'
  }

  return 'paid'
}

export function AnalyticsPage() {
  const { data } = useAppData()
  const { token } = useAuth()
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (!data?.analytics) {
    return null
  }

  const analytics = data.analytics

  const analyticsCards = [
    {
      label: 'Active workers',
      value: analytics.kpis.activeWorkers.toLocaleString('en-IN'),
      hint: '↑12%',
      accent: 'green' as const,
    },
    {
      label: 'Premium / week',
      value: formatCompactCurrency(analytics.kpis.weeklyPremium),
      hint: 'Stable',
      accent: 'sky' as const,
    },
    {
      label: 'Claims paid',
      value: formatCompactCurrency(analytics.kpis.claimsPaid),
      hint: 'AI Guardian',
      accent: 'gold' as const,
    },
    {
      label: 'Fraud detection',
      value: formatPercent(analytics.kpis.fraudDetectionRate),
      hint: 'AI Guardian',
      accent: 'green' as const,
    },
    {
      label: 'Avg payout',
      value: `${analytics.kpis.avgPayoutMinutes} min`,
      hint: 'Instant payouts',
      accent: 'sky' as const,
    },
  ]

  const handleExport = async () => {
    setBusy(true)
    setStatusMessage(null)

    try {
      const csv = await exportAnalytics(token)
      downloadTextFile(csv, 'kavach-zone-forecast.csv', 'text/csv;charset=utf-8')
      setStatusMessage('Analytics export downloaded.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not export analytics right now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.section
      {...pageTransition}
      className="section-shell space-y-8 pb-4 overflow-x-hidden"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="mono-label">Admin analytics</p>
          <h1 className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] text-navy">Analytics Overview</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Loss ratio, next-week claim forecast, fraud queue, and payout flow are pulled from the live backend.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
          <Link
            to="/claims"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-sky-light bg-white px-5 text-sm font-semibold text-navy transition hover:border-sky sm:w-auto"
          >
            Review claims
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-sky-light bg-white px-4 py-3 text-sm text-muted shadow-card">
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {analyticsCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            accent={card.accent}
            compact
          />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Loss ratio"
          value={formatPercent(analytics.lossRatio)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="gold"
          description="Current underwriting efficiency across live coverage cohorts."
        />
        <MetricCard
          label="Next-week claim forecast"
          value={`${analytics.predictedClaimsNextWeek.toLocaleString('en-IN')} claims`}
          icon={<Users className="h-4 w-4" />}
          tone="green"
          description={analytics.forecastSummary}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel-card p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mono-label">Weekly revenue distribution</p>
              <h2 className="mt-2 text-3xl font-serif text-navy">Premium inflow</h2>
            </div>
            <div className="rounded-full bg-sky-pale px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sky">
              8 weeks history
            </div>
          </div>
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyChartData}>
                <CartesianGrid stroke="#E8F2F6" strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fill: '#7A8EA0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#7A8EA0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}L`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(232,242,246,0.65)' }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-2xl border border-sky-light bg-white px-4 py-3 shadow-card">
                        <p className="font-semibold text-navy">{payload[0]?.payload.week}</p>
                        <p className="mt-1 text-sm text-muted">{formatLakhs(Number(payload[0]?.value ?? 0))}</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="premium" radius={[12, 12, 0, 0]}>
                  {analytics.weeklyChartData.map((entry) => (
                    <Cell key={entry.week} fill={entry.current ? '#C9A96E' : '#5BA3BE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card p-5">
          <div>
            <p className="mono-label">Claim origin analysis</p>
            <h2 className="mt-2 text-3xl font-serif text-navy">Incident mix</h2>
          </div>
          <div className="mt-4 h-[260px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.claimsBreakdown}
                  dataKey="value"
                  innerRadius={72}
                  outerRadius={98}
                  stroke="none"
                  paddingAngle={3}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-28 text-center sm:-mt-32">
            <div className="font-serif text-5xl text-navy">{analytics.claimsBreakdown[0]?.value ?? 0}%</div>
            <div className="mt-2 text-sm font-semibold text-muted">Rain major</div>
          </div>
          <div className="mt-12 space-y-3">
            {analytics.claimsBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-navy">{item.name}</span>
                </div>
                <span className="font-semibold text-muted">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="panel-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mono-label">Zone forecast</p>
              <h2 className="mt-2 text-3xl font-serif text-navy">Next week by corridor</h2>
            </div>
            <StatusPill status="active">Forecast</StatusPill>
          </div>

          <div className="mt-6 grid gap-3 md:hidden">
            {analytics.zoneForecasts.map((zone) => (
              <article key={zone.zone} className="rounded-[24px] bg-kavach px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-navy">{zone.zone}</div>
                    <p className="mt-2 text-sm text-muted">{zone.primaryTrigger}</p>
                  </div>
                  <StatusPill status={zone.premiumDelta >= 0 ? 'watch' : 'safe'}>
                    {zone.confidence}%
                  </StatusPill>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="mono-label">Claims</p>
                    <p className="mt-2 text-navy">{zone.likelyClaims}</p>
                  </div>
                  <div>
                    <p className="mono-label">Δ premium</p>
                    <p className="mt-2 text-navy">
                      {zone.premiumDelta >= 0 ? '+' : ''}
                      {zone.premiumDelta}
                    </p>
                  </div>
                  <div>
                    <p className="mono-label">Conf.</p>
                    <p className="mt-2 text-navy">{zone.confidence}%</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-sky-light md:block">
            <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-4 bg-kavach px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <span>Zone</span>
              <span>Primary trigger</span>
              <span>Claims</span>
              <span>Δ premium</span>
              <span>Conf.</span>
            </div>
            {analytics.zoneForecasts.map((zone) => (
              <div
                key={zone.zone}
                className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-4 border-t border-sky-light px-4 py-3 text-sm"
              >
                <span className="font-semibold text-navy">{zone.zone}</span>
                <span className="text-muted">{zone.primaryTrigger}</span>
                <span className="text-muted">{zone.likelyClaims}</span>
                <span className="font-semibold text-k-green">
                  {zone.premiumDelta >= 0 ? '+' : ''}
                  {zone.premiumDelta}
                </span>
                <span className="text-muted">{zone.confidence}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono-label">Fraud queue</p>
                <h2 className="mt-2 text-3xl font-serif text-navy">Manual review list</h2>
              </div>
              <StatusPill status="alert">{analytics.fraudQueue.length} queued</StatusPill>
            </div>
            <div className="mt-6 space-y-3">
              {analytics.fraudQueue.map((item) => (
                <div key={item.id} className="rounded-[24px] bg-kavach px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-navy">{item.workerName}</div>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {item.zone} · {item.reason}
                      </p>
                    </div>
                    <StatusPill status={queueTone(item.riskLabel)}>{item.riskLabel}</StatusPill>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted">Risk score</span>
                    <span className="font-semibold text-navy">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono-label">Action links</p>
                <h2 className="mt-2 text-3xl font-serif text-navy">Move from metrics to action</h2>
              </div>
              <ArrowRight className="h-5 w-5 text-gold" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/claims"
                className="inline-flex items-center justify-between rounded-[24px] border border-sky-light bg-white px-4 py-4 text-sm font-semibold text-navy transition hover:border-sky"
              >
                Claims view
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/alerts"
                className="inline-flex items-center justify-between rounded-[24px] border border-sky-light bg-white px-4 py-4 text-sm font-semibold text-navy transition hover:border-sky"
              >
                Support inbox
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/policy"
                className="inline-flex items-center justify-between rounded-[24px] border border-sky-light bg-white px-4 py-4 text-sm font-semibold text-navy transition hover:border-sky"
              >
                Policy review
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={busy}
                className="inline-flex items-center justify-between rounded-[24px] border border-sky-light bg-white px-4 py-4 text-sm font-semibold text-navy transition hover:border-sky disabled:cursor-not-allowed disabled:opacity-60"
              >
                Export snapshot
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mono-label">Recent payouts</p>
            <h2 className="mt-2 text-3xl font-serif text-navy">Latest settlement flow</h2>
          </div>
          <StatusPill status="paid">Live rail</StatusPill>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analytics.recentPayouts.map((payout) => (
            <article key={payout.reference} className="rounded-[24px] bg-kavach px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-navy">{payout.reference}</div>
                  <p className="mt-1 text-sm text-muted">{payout.updatedAt}</p>
                </div>
                <StatusPill status={payoutTone(payout.status)}>{payout.status}</StatusPill>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted">Provider</span>
                <span className="font-medium text-navy">{payout.provider}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted">Amount</span>
                <span className="font-semibold text-k-green">{formatCurrency(payout.amount)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </motion.section>
  )
}

function MetricCard({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string
  value: string
  description: string
  icon: ReactNode
  tone: 'green' | 'gold'
}) {
  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="mono-label">{label}</p>
        <div
          className={`grid h-9 w-9 place-items-center rounded-full ${
            tone === 'green' ? 'bg-[#E6F4EF] text-k-green' : 'bg-gold-light text-gold'
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 font-serif text-4xl text-navy">{value}</div>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </div>
  )
}
