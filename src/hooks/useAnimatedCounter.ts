import { animate, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

type UseAnimatedCounterOptions = {
  decimals?: number
  duration?: number
  enabled?: boolean
  formatter?: (value: number) => string
}

export function useAnimatedCounter(
  target: number,
  {
    decimals = 0,
    duration = 1,
    enabled = true,
    formatter,
  }: UseAnimatedCounterOptions = {},
) {
  const motionValue = useMotionValue(0)
  const transformed = useTransform(motionValue, (latest) => {
    const rounded = Number(latest.toFixed(decimals))
    return formatter ? formatter(rounded) : rounded.toFixed(decimals)
  })
  const disabledValue = formatter ? formatter(target) : target.toFixed(decimals)
  const [value, setValue] = useState(formatter ? formatter(0) : (0).toFixed(decimals))

  useEffect(() => {
    if (!enabled) {
      return
    }

    const unsubscribe = transformed.on('change', (latest) => {
      setValue(latest)
    })

    const controls = animate(motionValue, target, {
      duration,
      ease: 'easeOut',
    })

    return () => {
      unsubscribe()
      controls.stop()
    }
  }, [decimals, duration, enabled, formatter, motionValue, target, transformed])

  return enabled ? value : disabledValue
}
