import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, CloudRain, AlertTriangle, CheckCircle2 } from 'lucide-react'

const mockEvents = [
  { id: 1, type: 'alert', message: 'Heavy Rain detected in Koramangala zone', icon: CloudRain, color: 'text-sky' },
  { id: 2, type: 'status', message: 'Trust Score validated at 92', icon: CheckCircle2, color: 'text-k-green' },
  { id: 3, type: 'warning', message: 'Traffic Index spiking in HSR Layout', icon: AlertTriangle, color: 'text-k-orange' },
  { id: 4, type: 'system', message: 'Payout rails functioning normally', icon: Activity, color: 'text-muted' },
  { id: 5, type: 'warning', message: 'Civic unrest reported in Indiranagar', icon: AlertTriangle, color: 'text-k-red' },
  { id: 6, type: 'alert', message: 'Rainfall exceeding 15mm/hr', icon: CloudRain, color: 'text-sky' },
]

export function LiveTelemetryFeed() {
  const [events, setEvents] = useState<typeof mockEvents>([])
  
  useEffect(() => {
    // Initial events
    setEvents([mockEvents[1], mockEvents[3]])
    
    // Simulate incoming telemetry data
    let eventIndex = 0
    const interval = setInterval(() => {
      const nextEventIndex = [0, 2, 4, 5][eventIndex % 4]
      const newEvent = { ...mockEvents[nextEventIndex], id: Date.now() }
      
      setEvents(prev => [newEvent, ...prev].slice(0, 5))
      eventIndex++
    }, 4500) // add a new event every 4.5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="panel-card p-6 sm:p-7 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="mono-label flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-k-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-k-green"></span>
            </span>
            Live Telemetry Feed
          </p>
          <h2 className="mt-2 text-2xl font-serif text-navy">Grid Activity</h2>
        </div>
      </div>
      
      <div className="flex-1 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 bottom-0 left-[15px] w-px bg-gradient-to-b from-sky-light/80 to-transparent" />
        <AnimatePresence mode="popLayout">
          {events.map((event) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              key={event.id}
              className="relative flex items-start gap-4 z-10"
            >
              <div className="bg-kavach border border-sky-light rounded-full p-1.5 z-10 mt-0.5">
                 <event.icon className={`w-3.5 h-3.5 ${event.color}`} />
              </div>
              <div className="bg-white/40 rounded-xl px-4 py-2 text-sm text-navy shadow-sm border border-white flex-1">
                {event.message}
                <div className="text-[10px] text-muted mt-1 uppercase tracking-wider font-mono">Just now</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
