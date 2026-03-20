import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

type StatusPillProps = {
  status: string
  className?: string
  children?: ReactNode
}

const variants: Record<string, string> = {
  paid: 'bg-[#E6F4EF] text-k-green',
  safe: 'bg-[#E6F4EF] text-k-green',
  verified: 'bg-[#E6F4EF] text-k-green',
  active: 'bg-sky-pale text-sky',
  watch: 'bg-sky-pale text-sky',
  processing: 'bg-sky-pale text-sky',
  linked: 'bg-sky-pale text-sky',
  pending: 'bg-gold-light text-gold',
  alert: 'bg-gold-light text-gold',
  medium: 'bg-gold-light text-gold',
  bonus: 'bg-gold-light text-gold',
  excellent: 'bg-[#E6F4EF] text-k-green',
  up: 'bg-gold-light text-gold',
  weather: 'bg-sky-pale text-sky',
  flagged: 'bg-[#FDE8E8] text-k-red',
  triggered: 'bg-[#FDE8E8] text-k-red',
  critical: 'bg-[#FDE8E8] text-k-red',
}

export function StatusPill({ status, className, children }: StatusPillProps) {
  const normalized = status.toLowerCase()

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]',
        variants[normalized] ?? 'bg-sky-pale text-sky',
        className,
      )}
    >
      {children ?? status}
    </span>
  )
}
