import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'

export function TrustGauge() {
  const trustScore = 92
  
  return (
    <div className="rounded-[32px] border border-sky-light bg-[linear-gradient(135deg,#0D2B3E_0%,#1A4560_100%)] shadow-card overflow-hidden">
      <div className="p-6 sm:p-7 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-sky-light/80">Trust Profile</p>
            <h2 className="mt-3 text-2xl font-serif text-white">Trust Score</h2>
          </div>
          <div className="bg-white/10 p-2 border border-white/20 rounded-full">
             <ShieldCheck className="w-5 h-5 text-gold" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center">
           <div className="relative w-48 h-24 overflow-hidden">
             {/* Gauge Background */}
             <div className="absolute top-0 left-0 w-full h-full border-[16px] border-white/10 border-b-0 rounded-t-full" />
             {/* Gauge Fill */}
             <motion.div 
               initial={{ rotate: -180 }}
               animate={{ rotate: -180 + (180 * (trustScore / 100)) }}
               transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
               className="absolute top-0 left-0 w-full h-full border-[16px] border-gold border-b-0 rounded-t-full origin-bottom"
             />
             <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-2">
                <span className="text-4xl font-serif text-white">{trustScore}</span>
                <span className="text-[10px] text-sky-light font-mono uppercase tracking-widest">Excellent</span>
             </div>
           </div>
        </div>

        <p className="mt-8 text-sm text-sky-light/80 text-center leading-6">
          Your score is calculated based on Identity Risk (30%), Geo-Consistency (50%), and Network Trust (20%).
        </p>

        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
          <Link to="/profile" className="flex w-full items-center justify-between text-sm text-white group hover:bg-white/5 p-2 rounded-lg transition">
             <span>Connect Zomato Profile</span>
             <span className="text-gold font-bold flex items-center text-xs">+5 pts <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
          </Link>
          <Link to="/profile" className="flex w-full items-center justify-between text-sm text-white group hover:bg-white/5 p-2 rounded-lg transition">
             <span>Enable Device Telemetry</span>
             <span className="text-gold font-bold flex items-center text-xs">+3 pts <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
          </Link>
        </div>
      </div>
    </div>
  )
}
