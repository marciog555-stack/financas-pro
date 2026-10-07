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
  pct: number | null
  spent: number
}

export function BudgetAllocationCard({ items, monthlyIncome }: { items: BudgetItem[]; monthlyIncome: number }) {
  const supabase = createClient()
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const allocatedPct = items.reduce((s, i) => s + (i.pct ?? 0), 0)
  const visible = items.filter((i) => i.pct != null || i.spent > 0)

  function startEdit(item: BudgetItem) {
    setEditingId(item.id)
    setValue(item.pct != null ? String(item.pct) : '')
  }

  async function handleSave(item: BudgetItem) {
    const parsed = value.trim() === '' ? null : Number(value.replace(',', '.'))
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) return
    setSaving(true)
    await supabase.from('expense_categories').update({ budget_pct: parsed }).eq('id', item.id)
    setSaving(false)
    setEditingId(null)
    router.refresh()
  }

  if (visible.length === 0) {
    return (
      <Card>
        <h2 className="text-sm font-semibold">Uso do Orçamento</h2>
        <p className="mt-2 text-xs text-foreground/40">
          Divida os 100% da renda em etapas por categoria (ex: Moradia 30%, Mercado 15%). Toque numa categoria com
          gasto no mês pra começar.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Uso do Orçamento</h2>
        <span className={`text-xs font-medium ${allocatedPct > 100 ? 'text-accent-red' : 'text-accent-emerald'}`}>
          {Math.round(allocatedPct)}% da renda alocada
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {visible.map((item) => {
          const effectiveLimit = item.pct != null && monthlyIncome > 0 ? (item.pct / 100) * monthlyIncome : null
          const pctUsed = effectiveLimit && effectiveLimit > 0 ? Math.min(100, Math.round((item.spent / effectiveLimit) * 100)) : 0
          const over = effectiveLimit != null && item.spent > effectiveLimit
          return (
            <div key={item.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-foreground/70">
                  {item.emoji} {item.label}
                </span>
                {editingId === item.id ? null : item.pct != null ? (
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className={`flex items-center gap-1 font-semibold ${over ? 'text-accent-red' : 'text-foreground'}`}
                  >
                    {pctUsed}% <Pencil size={10} className="text-foreground/30" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="flex items-center gap-1 text-foreground/40 hover:text-foreground/70"
                  >
                    definir % da renda <Pencil size={10} />
                  </button>
                )}
              </div>
              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    placeholder="Ex: 15"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 py-1.5 text-xs"
                    autoFocus
                  />
                  <span className="shrink-0 text-xs text-foreground/40">% da renda</span>
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
                    value={pctUsed}
                    className="h-2"
                    barClassName={over ? 'bg-accent-red' : 'bg-gradient-to-r from-accent-emerald to-accent-blue'}
                  />
                  {effectiveLimit != null && (
                    <p className="mt-1 text-right text-[10px] text-foreground/40">
                      {fmtCurrency(item.spent)} de {fmtCurrency(effectiveLimit)} ({item.pct}% da renda)
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
