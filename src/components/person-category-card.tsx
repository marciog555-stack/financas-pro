'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, Select } from '@/components/ui'
import { BottomSheet } from '@/components/bottom-sheet'
import { Avatar } from '@/components/avatar'
import { CategoryPieChart } from '@/components/reports-charts'
import { fmtCurrency, fmtDate } from '@/lib/format'
import { PIE_COLORS } from '@/lib/chart-colors'

type CategoryOption = { key: string; label: string; emoji: string }
type ExpenseItem = { id: string; name: string; amount: number; due_date: string | null; category: string }
type CategoryDatum = { key: string; name: string; emoji: string; value: number }

export function PersonCategoryCard({
  person,
  categories,
}: {
  person: {
    id: string
    name: string
    avatarUrl: string | null
    data: CategoryDatum[]
    total: number
    expenses: ExpenseItem[]
    pendingCount: number
  }
  categories: CategoryOption[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [items, setItems] = useState(person.expenses)
  const [savingId, setSavingId] = useState<string | null>(null)

  const openLabel = categories.find((c) => c.key === openCategory)
  const itemsInOpenCategory = items.filter((e) => e.category === openCategory)

  async function handleRecategorize(expenseId: string, newCategory: string) {
    setSavingId(expenseId)
    setItems((prev) => prev.map((e) => (e.id === expenseId ? { ...e, category: newCategory } : e)))
    await supabase.from('expenses').update({ category: newCategory }).eq('id', expenseId)
    setSavingId(null)
    router.refresh()
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar name={person.name} src={person.avatarUrl} size={24} />
          <h2 className="text-sm font-semibold">Gastos de {person.name.split(' ')[0]}</h2>
        </div>
        {person.pendingCount > 0 && (
          <Link
            href="/auditor"
            className="flex items-center gap-1 rounded-full border border-accent-orange/30 bg-accent-orange/10 px-2.5 py-1 text-[11px] font-medium text-accent-orange"
          >
            <AlertTriangle size={12} />
            {person.pendingCount} furo{person.pendingCount > 1 ? 's' : ''} de caixa
          </Link>
        )}
      </div>
      <CategoryPieChart data={person.data} total={person.total} />
      {person.data.length > 0 && (
        <div className="mt-4 flex flex-col divide-y divide-border">
          {person.data.map((c, i) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setOpenCategory(c.key)}
              className="flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-surface-2/50"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground/70">
                {c.emoji} {c.name}
              </span>
              <span className="shrink-0 text-right font-mono text-sm font-medium">{fmtCurrency(c.value)}</span>
            </button>
          ))}
        </div>
      )}

      <BottomSheet
        open={openCategory !== null}
        onClose={() => setOpenCategory(null)}
        title={openLabel ? `${openLabel.emoji} ${openLabel.label} — ${person.name.split(' ')[0]}` : undefined}
      >
        <div className="flex flex-col divide-y divide-border pb-2">
          {itemsInOpenCategory.length === 0 && (
            <p className="py-6 text-center text-sm text-foreground/40">Nada aqui agora.</p>
          )}
          {itemsInOpenCategory.map((e) => (
            <div key={e.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  {e.due_date && <p className="text-xs text-foreground/40">{fmtDate(e.due_date)}</p>}
                </div>
                <span className="shrink-0 font-mono text-sm font-medium">{fmtCurrency(e.amount)}</span>
              </div>
              <Select
                value={e.category}
                disabled={savingId === e.id}
                onChange={(ev) => handleRecategorize(e.id, ev.target.value)}
                className="text-xs"
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </BottomSheet>
    </Card>
  )
}
