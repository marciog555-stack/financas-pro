'use client'

export function AmountInput({
  value,
  onChange,
  tone = 'foreground',
}: {
  value: string
  onChange: (value: string) => void
  tone?: 'foreground' | 'red' | 'emerald'
}) {
  const toneClass =
    tone === 'red' ? 'text-accent-red' : tone === 'emerald' ? 'text-accent-emerald' : 'text-foreground'

  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground/40">Valor</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl font-semibold ${toneClass}/50`}>R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={`w-40 border-none bg-transparent text-center text-4xl font-semibold tracking-tight outline-none placeholder:text-foreground/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${toneClass}`}
        />
      </div>
    </div>
  )
}
