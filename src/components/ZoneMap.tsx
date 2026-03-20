import { motion } from 'framer-motion'
import { worker } from '../data/mockData'
import { cn } from '../utils/cn'

const zones = [
  { name: 'Koramangala', top: '50%', left: '34%', tone: 'bg-k-red', risk: 'High risk' },
  { name: 'HSR Layout', top: '68%', left: '68%', tone: 'bg-k-orange', risk: 'Medium' },
  { name: 'Indiranagar', top: '36%', left: '76%', tone: 'bg-k-green', risk: 'Clear' },
]

export function ZoneMap() {
  return (
    <div className="panel-card overflow-hidden p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="mono-label">Live risk zones</p>
          <h3 className="mt-2 text-2xl font-serif text-navy">Bengaluru South</h3>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-k-red" />
            High Risk
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-k-orange" />
            Medium
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-k-green" />
            Clear
          </span>
        </div>
      </div>
      <div className="relative h-[320px] overflow-hidden rounded-[22px] bg-gradient-to-br from-sky-pale via-white to-sky-pale map-grid">
        <div className="absolute inset-y-0 left-[18%] w-[2px] bg-white/60 blur-[1px]" />
        <div className="absolute inset-y-0 right-[18%] w-[2px] bg-white/60 blur-[1px]" />
        <div className="absolute inset-x-[26%] top-[14%] h-[72%] rounded-[32px] border border-navy/8 bg-white/25 backdrop-blur-sm" />

        {zones.map((zone) => (
          <motion.div
            key={zone.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            className="absolute"
            style={{ top: zone.top, left: zone.left }}
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <span className={cn('absolute inset-0 rounded-full opacity-30 animate-zone-pulse', zone.tone)} />
              <span className={cn('absolute inset-0 rounded-full opacity-25 animate-zone-pulse [animation-delay:300ms]', zone.tone)} />
              <span className={cn('relative block h-5 w-5 rounded-full border-4 border-white shadow-lg', zone.tone)} />
              <div className="absolute left-1/2 top-7 min-w-[120px] -translate-x-1/2 rounded-full bg-white px-3 py-1 text-center text-[11px] font-semibold text-navy shadow-card">
                {zone.name}
              </div>
            </div>
          </motion.div>
        ))}

        <div className="absolute bottom-5 left-5 rounded-2xl bg-white/90 px-4 py-3 shadow-card backdrop-blur">
          <p className="mono-label">Active watch</p>
          <p className="mt-1 text-sm font-semibold text-navy">{worker.zone}</p>
        </div>
      </div>
    </div>
  )
}
