'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input } from '@/components/ui'
import { ProgressBar } from '@/components/progress-bar'
import { fmtCurrency } from '@/lib/format'

export function SpendingLimitCard({
  householdId,
  monthLabel,
  spent,
  limit,
  daysLeftInMonth,
}: {
  householdId: string
  monthLabel: string
  spent: number
  limit: number | null
  daysLeftInMonth: number | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(limit != null ? String(limit) : '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const parsed = value.trim() === '' ? null : Number(value.replace(',', '.'))
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) return

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('households')
      .update({ monthly_budget: parsed })
      .eq('id', householdId)
    setSaving(false)
    if (!error) {
      setEditing(false)
      router.refresh()
    }
  }

  const pct = limit && limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const remaining = limit != null ? limit - spent : null
  const perDay = remaining != null && remaining > 0 && daysLeftInMonth ? remaining / daysLeftInMonth : null

  return (
    <Card className="animate-fade-in-up [animation-delay:80ms]">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Gasto em {monthLabel}</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setValue(limit != null ? String(limit) : '')
              setEditing(true)
            }}
            className="flex items-center gap-1 text-xs font-medium text-foreground/40 hover:text-foreground/70"
          >
            {limit != null ? `limite ${fmtCurrency(limit)}` : 'definir limite'} <Pencil size={11} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <Input
            inputMode="decimal"
            placeholder="Ex: 1000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '...' : 'Salvar'}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight">{fmtCurrency(spent)}</p>
            {limit != null && <span className="pb-1 text-sm text-foreground/40">{pct}%</span>}
          </div>
          {limit != null && (
            <>
              <ProgressBar
                value={pct}
                className="mt-3 h-2"
                barClassName={spent > limit ? 'bg-accent-red' : 'bg-accent-emerald'}
              />
              <p className="mt-2 text-right text-xs text-foreground/40">
                {remaining != null && remaining >= 0
                  ? `${fmtCurrency(remaining)} restantes`
                  : `${fmtCurrency(Math.abs(remaining ?? 0))} acima do limite`}
              </p>
              {perDay != null && (
                <p className="mt-1 text-center text-xs text-foreground/35">
                  São {fmtCurrency(perDay)} por dia até o fim do mês
                </p>
              )}
            </>
          )}
        </>
      )}
    </Card>
  )
}
