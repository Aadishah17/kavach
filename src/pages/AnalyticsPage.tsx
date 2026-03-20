import { motion } from 'framer-motion'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { KpiCard } from '../components/KpiCard'
import { analyticsKpis, claimsBreakdown, financialHealth, fraudSignals, unitEconomics, weeklyChartData } from '../data/mockData'
import { pageTransition } from '../lib/motion'
import { formatCompactCurrency, formatPercent } from '../utils/format'

const analyticsCards = [
  { label: 'Active workers', value: analyticsKpis.activeWorkers.toLocaleString('en-IN'), hint: '↑12%', accent: 'green' as const },
  { label: 'Premium / week', value: formatCompactCurrency(analyticsKpis.weeklyPremium), hint: 'Stable', accent: 'sky' as const },
  { label: 'Claims paid', value: formatCompactCurrency(analyticsKpis.claimsPaid), hint: 'AI Guardian', accent: 'gold' as const },
  { label: 'Fraud detection', value: formatPercent(analyticsKpis.fraudDetectionRate), hint: 'AI Guardian', accent: 'green' as const },
  { label: 'Avg payout', value: `${analyticsKpis.avgPayoutMinutes} min`, hint: 'Instant payouts', accent: 'sky' as const },
]

export function AnalyticsPage() {
  return (
    <motion.section
      {...pageTransition}
      className="space-y-8 pb-4"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mono-label">Admin analytics</p>
          <h1 className="mt-3 text-[44px] leading-none">Analytics Overview</h1>
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-mid"
        >
          Export data
        </button>
      </header>

      <section className="grid gap-4 xl:grid-cols-5">
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

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mono-label">Weekly revenue distribution</p>
              <h2 className="mt-2 text-3xl">Premium inflow</h2>
            </div>
            <div className="rounded-full bg-sky-pale px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sky">
              8 weeks history
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <Tooltip
                  cursor={{ fill: 'rgba(232,242,246,0.65)' }}
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid #C6D1C7',
                    boxShadow: '0 4px 24px rgba(13,43,62,0.08)',
                  }}
                />
                <Bar
                  dataKey="premium"
                  radius={[12, 12, 0, 0]}
                >
                  {weeklyChartData.map((entry) => (
                    <Cell
                      key={entry.week}
                      fill={entry.current ? '#C9A96E' : '#5BA3BE'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card p-5">
          <div>
            <p className="mono-label">Claim origin analysis</p>
            <h2 className="mt-2 text-3xl">Incident mix</h2>
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={claimsBreakdown}
                  dataKey="value"
                  innerRadius={72}
                  outerRadius={98}
                  stroke="none"
                  paddingAngle={3}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-32 text-center">
            <div className="font-serif text-5xl text-navy">62%</div>
            <div className="mt-2 text-sm font-semibold text-muted">Rain major</div>
          </div>
          <div className="mt-12 space-y-3">
            {claimsBreakdown.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-navy">{item.name}</span>
                </div>
                <span className="font-semibold text-muted">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mono-label">AI fraud signals</p>
              <h2 className="mt-2 text-3xl">Predictive risk assessment</h2>
            </div>
          </div>
          <div className="space-y-5">
            {fraudSignals.map((signal) => (
              <div key={signal.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-navy">{signal.label}</span>
                  <span className="font-semibold text-muted">
                    {signal.note ?? `${signal.value}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-sky-pale">
                  <div
                    className={`h-full rounded-full ${signal.tone}`}
                    style={{ width: `${signal.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card p-5">
          <div>
            <p className="mono-label">Financial underwriting</p>
            <h2 className="mt-2 text-3xl">Real-time solvency</h2>
          </div>
          <div className="mt-6 space-y-5">
            {financialHealth.map((metric) => (
              <div key={metric.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-navy">{metric.label}</span>
                  <span className="font-semibold text-muted">{metric.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-sky-pale">
                  <div
                    className={`h-full rounded-full ${metric.tone}`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-sky-light">
            <div className="grid grid-cols-3 gap-4 bg-kavach px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <span>Metric</span>
              <span>Unit value</span>
              <span>Margin</span>
            </div>
            {unitEconomics.map((item) => (
              <div
                key={item.metric}
                className="grid grid-cols-3 gap-4 border-t border-sky-light px-4 py-3 text-sm"
              >
                <span className="text-navy">{item.metric}</span>
                <span className="text-muted">{item.unitValue}</span>
                <span className="font-semibold text-k-green">{item.margin}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] px-8 py-10 text-white shadow-lg">
        <p className="mono-label !text-sky-light">Architectural shield</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:items-end">
          <div>
            <h2 className="text-4xl text-white">The architectural shield in action</h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-sky-light/75">
              Kavach is monitoring 1.2M weather points across 42 metro zones to pre-emptively lock and release coverage.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mono-label !text-gold">Bengaluru zone</div>
            <div className="mt-3 text-2xl font-serif text-white">High precipitation risk</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mono-label !text-gold">Savdhaan zone</div>
            <div className="mt-3 text-2xl font-serif text-white">Civic disruption watch</div>
          </div>
        </div>
      </section>
    </motion.section>
  )
}
