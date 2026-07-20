'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
  barColor,
}: {
  value: number
  className?: string
  trackClassName?: string
  barClassName?: string
  barColor?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(clamped))
    return () => cancelAnimationFrame(id)
  }, [clamped])

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', trackClassName, className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          !barColor && (barClassName ?? 'bg-accent-emerald')
        )}
        style={{ width: `${width}%`, backgroundColor: barColor }}
      />
    </div>
  )
}
