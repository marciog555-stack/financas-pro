'use client'

import { useEffect, useRef, useState } from 'react'
import { fmtCurrency } from '@/lib/format'

export function AnimatedNumber({
  value,
  format = 'currency',
  duration = 600,
  className,
}: {
  value: number
  format?: 'currency' | 'integer'
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const from = prevValue.current
    const to = value
    const start = performance.now()

    let frame: number
    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        prevValue.current = to
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span className={className}>
      {format === 'currency' ? fmtCurrency(display) : Math.round(display).toLocaleString('pt-BR')}
    </span>
  )
}
