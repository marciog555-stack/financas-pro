import { cn } from '@/lib/cn'

const COLORS = [
  'bg-accent-emerald/15 text-accent-emerald',
  'bg-accent-blue/15 text-accent-blue',
  'bg-accent-purple/15 text-accent-purple',
  'bg-accent-orange/15 text-accent-orange',
  'bg-accent-red/15 text-accent-red',
]

function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return COLORS[hash % COLORS.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold', colorFor(name), className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  )
}
