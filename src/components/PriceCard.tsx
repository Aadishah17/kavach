import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'
import { formatCurrency } from '../utils/format'

type PriceCardProps = {
  tier: string
  price: number
  coverage: string
  features: string[]
  featured?: boolean
}

export function PriceCard({
  tier,
  price,
  coverage,
  features,
  featured = false,
}: PriceCardProps) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      className={cn(
        'relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-card',
        featured ? 'border-2 border-navy shadow-lg' : 'border-sky-light',
      )}
    >
      {featured ? (
        <div className="absolute inset-x-6 -top-4 rounded-full bg-navy px-4 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white">
          Most Popular
        </div>
      ) : null}
      <div className={cn('space-y-4', featured && 'pt-4')}>
        <div>
          <p className="mono-label">{tier}</p>
          <p className="mt-3 font-serif text-5xl text-navy">{formatCurrency(price)}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{coverage}</p>
        </div>
        <div className="space-y-3 border-t border-sky-light pt-5">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3 text-sm text-navy">
              <span className="mt-0.5 rounded-full bg-sky-pale p-1 text-sky">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <Link
        to="/signup"
        className={cn(
          'mt-8 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5',
          featured
            ? 'bg-navy text-white'
            : 'border border-navy bg-white text-navy',
        )}
      >
        Get Protected
      </Link>
    </motion.article>
  )
}
