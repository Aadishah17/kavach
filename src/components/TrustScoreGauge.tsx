import { motion } from 'framer-motion'

type TrustScoreGaugeProps = {
  score: number
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

const arcSegments = [
  { start: -180, end: -135, color: '#B83232' },
  { start: -135, end: -90, color: '#D4691E' },
  { start: -90, end: -45, color: '#C9A96E' },
  { start: -45, end: 0, color: '#1E7E5E' },
]

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const finalAngle = -90 + (Math.min(Math.max(score, 0), 100) / 100) * 180

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 120" role="img" aria-label={`Trust score ${score}`}>
        <path
          d={describeArc(100, 100, 72, -180, 0)}
          fill="none"
          stroke="#E8F2F6"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {arcSegments.map((segment) => (
          <path
            key={`${segment.start}-${segment.end}`}
            d={describeArc(100, 100, 72, segment.start, segment.end)}
            fill="none"
            stroke={segment.color}
            strokeWidth="18"
            strokeLinecap="round"
          />
        ))}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: finalAngle }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <line
            x1="100"
            y1="100"
            x2="154"
            y2="100"
            stroke="#0D2B3E"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </motion.g>
        <circle cx="100" cy="100" r="8" fill="white" stroke="#0D2B3E" strokeWidth="3" />
      </svg>
      <div className="-mt-2 text-center">
        <p className="font-serif text-5xl leading-none text-navy">{score}</p>
        <p className="mt-2 text-sm font-semibold text-k-green">Excellent · Auto-approved</p>
      </div>
    </div>
  )
}
