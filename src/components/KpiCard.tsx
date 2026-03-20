import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

type KpiCardProps = {
  label: string
  value: string
  hint: string
  accent?: 'green' | 'gold' | 'sky' | 'navy'
  inverse?: boolean
  compact?: boolean
}

const accentStyles = {
  green: 'text-k-green',
  gold: 'text-gold',
  sky: 'text-sky',
  navy: 'text-navy',
}

export function KpiCard({
  label,
  value,
  hint,
  accent = 'sky',
  inverse = false,
  compact = false,
}: KpiCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'panel-card flex h-full flex-col justify-between',
        inverse && 'border-navy bg-navy text-white shadow-lg',
        compact ? 'p-4' : 'p-5',
      )}
    >
      <div className="space-y-2">
        <p
          className={cn(
            'mono-label',
            inverse && '!text-sky-light',
            compact && '!tracking-[0.18em]',
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'font-serif text-[34px] leading-none',
            inverse ? 'text-white' : 'text-navy',
            compact && 'text-[28px]',
          )}
        >
          {value}
        </p>
      </div>
      <p
        className={cn(
          'mt-3 text-sm font-semibold',
          inverse ? 'text-sky-light' : accentStyles[accent],
        )}
      >
        {hint}
      </p>
    </motion.article>
  )
}
