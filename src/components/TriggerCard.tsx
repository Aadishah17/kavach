import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

type TriggerCardProps = {
  emoji: string
  name: string
  condition: string
  coverage: number
}

function coverageClass(coverage: number) {
  if (coverage >= 100) {
    return 'bg-[#FDE8E8] text-k-red'
  }

  if (coverage >= 75) {
    return 'bg-[#FFF2E8] text-k-orange'
  }

  return 'bg-gold-light text-gold'
}

export function TriggerCard({
  emoji,
  name,
  condition,
  coverage,
}: TriggerCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="panel-card flex h-full flex-col gap-4 p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{emoji}</span>
        <span
          className={cn(
            'rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]',
            coverageClass(coverage),
          )}
        >
          {coverage}%
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-navy">{name}</h3>
        <p className="text-sm leading-6 text-muted">{condition}</p>
      </div>
    </motion.article>
  )
}
