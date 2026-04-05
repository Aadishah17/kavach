import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const lossFactors = {
  rain: { value: 650, label: 'Heavy Rain' },
  heat: { value: 300, label: 'Extreme Heat' },
  traffic: { value: 450, label: 'Civic Disruption' },
}

export function RiskCalculator() {
  const [shifts, setShifts] = useState(6)
  const [trigger, setTrigger] = useState<keyof typeof lossFactors>('rain')

  const riskLoss = lossFactors[trigger].value
  const unprotectedLoss = shifts * riskLoss
  const kavachPayout = unprotectedLoss * 0.8 // 80% coverage
  const netSaved = kavachPayout - 199 // Assume Pro plan cost is 199/month

  return (
    <div className="rounded-[32px] bg-navy p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grid opacity-20" />
      <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1 space-y-6">
          <h3 className="font-serif text-3xl text-white">Risk Calculator</h3>
          <p className="text-sky-light/80 text-sm">
            Simulate how much income is at risk when you can't ride.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-sky-light/60">
                Weekly At-Risk Shifts
              </label>
              <input
                type="range"
                min="1"
                max="14"
                value={shifts}
                onChange={(e) => setShifts(Number(e.target.value))}
                className="w-full accent-gold mt-2 cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-xs text-sky-light/60">
                <span>1 shift</span>
                <span className="text-gold font-bold">{shifts} shifts</span>
                <span>14 shifts</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-sky-light/60 block mb-2">
                Primary Threat
              </label>
              <div className="flex gap-2">
                {(Object.keys(lossFactors) as Array<keyof typeof lossFactors>).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrigger(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold font-mono tracking-wider transition ${
                      trigger === t ? 'bg-gold text-navy' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {lossFactors[t].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="space-y-4">
             <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-sm text-sky-light/70 uppercase font-mono tracking-wider">Unprotected Loss</span>
                <span className="text-xl font-serif text-white">₹{unprotectedLoss.toFixed(0)}</span>
             </div>
             
             <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-sm text-sky-light/70 uppercase font-mono tracking-wider">Kavach Payout</span>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={kavachPayout}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-serif text-k-green font-bold"
                  >
                    +₹{kavachPayout.toFixed(0)}
                  </motion.span>
                </AnimatePresence>
             </div>

             <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-sky-light/50">Net earnings saved (after premium)</span>
                <span className="text-lg font-serif text-gold font-bold">₹{netSaved.toFixed(0)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
