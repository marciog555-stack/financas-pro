'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, Input, Button } from '@/components/ui'
import { ProgressBar } from '@/components/progress-bar'
import { fmtCurrency } from '@/lib/format'

type BudgetItem = {
  id: string
  key: string
  label: string
  emoji: string
  limit: number | null
  spent: number
}

export function BudgetAllocationCard({ items }: { items: BudgetItem[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const withLimit = items.filter((i) => i.limit != null && i.limit > 0)
  const totalLimit = withLimit.reduce((s, i) => s + (i.limit ?? 0), 0)
  const totalSpent = withLimit.reduce((s, i) => s + i.spent, 0)
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : null

  const visible = items.filter((i) => i.limit != null || i.spent > 0)

  function startEdit(item: BudgetItem) {
    setEditingId(item.id)
    setValue(item.limit != null ? String(item.limit) : '')
  }

  async function handleSave(item: BudgetItem) {
    const parsed = value.trim() === '' ? null : Number(value.replace(',', '.'))
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) return
    setSaving(true)
    await supabase.from('expense_categories').update({ monthly_limit: parsed }).eq('id', item.id)
    setSaving(false)
    setEditingId(null)
    router.refresh()
  }

  if (visible.length === 0) {
    return (
      <Card>
        <h2 className="text-sm font-semibold">Uso do Orçamento</h2>
        <p className="mt-2 text-xs text-foreground/40">
          Defina um limite mensal pra cada categoria pra acompanhar o quanto já foi gasto. Toque numa categoria com
          gasto no mês pra começar.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Uso do Orçamento</h2>
        {overallPct != null && <span className="text-xs font-medium text-accent-emerald">{overallPct}% Total</span>}
      </div>
      <div className="flex flex-col gap-3">
        {visible.map((item) => {
          const pct = item.limit && item.limit > 0 ? Math.min(100, Math.round((item.spent / item.limit) * 100)) : 0
          const over = item.limit != null && item.spent > item.limit
          return (
            <div key={item.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-foreground/70">
                  {item.emoji} {item.label}
                </span>
                {editingId === item.id ? null : item.limit != null ? (
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className={`flex items-center gap-1 font-semibold ${over ? 'text-accent-red' : 'text-foreground'}`}
                  >
                    {pct}% <Pencil size={10} className="text-foreground/30" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="flex items-center gap-1 text-foreground/40 hover:text-foreground/70"
                  >
                    definir limite <Pencil size={10} />
                  </button>
                )}
              </div>
              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    placeholder="Ex: 600"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 py-1.5 text-xs"
                    autoFocus
                  />
                  <Button type="button" size="sm" onClick={() => handleSave(item)} disabled={saving}>
                    {saving ? '...' : 'Salvar'}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)} disabled={saving}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <>
                  <ProgressBar
                    value={item.limit != null ? pct : 0}
                    className="h-2"
                    barClassName={over ? 'bg-accent-red' : 'bg-gradient-to-r from-accent-emerald to-accent-blue'}
                  />
                  {item.limit != null && (
                    <p className="mt-1 text-right text-[10px] text-foreground/40">
                      {fmtCurrency(item.spent)} de {fmtCurrency(item.limit)}
                    </p>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
