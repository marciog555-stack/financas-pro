/** Arco mostrando o quanto o saldo entre os dois está pendente de acerto.
 * fraction vai de -1 (você deve o máximo) a 1 (o parceiro deve o máximo), 0 = em dia. */
export function SettleGauge({ fraction, tone }: { fraction: number; tone: 'even' | 'owed' | 'owes' }) {
  const clamped = Math.max(-1, Math.min(1, fraction))
  const angleDeg = 180 - ((clamped + 1) / 2) * 180
  const rad = (angleDeg * Math.PI) / 180
  const cx = 100
  const cy = 100
  const r = 80
  const tickInner = r - 15
  const tickOuter = r + 15
  const x1 = cx + tickInner * Math.cos(rad)
  const y1 = cy - tickInner * Math.sin(rad)
  const x2 = cx + tickOuter * Math.cos(rad)
  const y2 = cy - tickOuter * Math.sin(rad)

  const tickColor =
    tone === 'owed' ? 'var(--accent-emerald)' : tone === 'owes' ? 'var(--accent-red)' : '#fff'

  return (
    <svg viewBox="0 0 200 108" className="mx-auto w-full max-w-xs">
      <path
        d="M20 100 A80 80 0 0 1 180 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={22}
        strokeLinecap="round"
        className="text-surface-2"
      />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tickColor} strokeWidth={6} strokeLinecap="round" />
    </svg>
  )
}
