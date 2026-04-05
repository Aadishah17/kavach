import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'Mon', premium: 49, risk: 10 },
  { day: 'Tue', premium: 52, risk: 25 },
  { day: 'Wed', premium: 55, risk: 35 },
  { day: 'Thu', premium: 89, risk: 85 }, // High risk mock day
  { day: 'Fri', premium: 61, risk: 40 },
  { day: 'Sat', premium: 49, risk: 15 },
  { day: 'Sun', premium: 49, risk: 5 },
]

export function RiskTrendChart() {
  return (
    <div className="panel-card p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="mono-label">Historical Pricing</p>
          <h2 className="mt-2 text-2xl font-serif text-navy">Premium Drift vs Risk</h2>
        </div>
      </div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#C9A96E" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4691E" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#D4691E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A8EA0' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A8EA0' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              itemStyle={{ fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="risk" stroke="#D4691E" fillOpacity={1} fill="url(#colorRisk)" name="Risk Score" />
            <Area type="monotone" dataKey="premium" stroke="#C9A96E" fillOpacity={1} fill="url(#colorPremium)" name="Premium (₹)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
