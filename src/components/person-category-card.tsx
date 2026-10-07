'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { Card, Select, Input, Button } from '@/components/ui'
import { BottomSheet } from '@/components/bottom-sheet'
import { Avatar } from '@/components/avatar'
import { CategoryPieChart } from '@/components/reports-charts'
import { fmtCurrency, fmtDate } from '@/lib/format'
import { PIE_COLORS } from '@/lib/chart-colors'

type CategoryOption = { key: string; label: string; emoji: string }
type ExpenseItem = { id: string; name: string; amount: number; due_date: string | null; category: string }
type CategoryDatum = { key: string; name: string; emoji: string; value: number }

const NEW_CATEGORY_VALUE = '__new__'

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

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
  const { household } = useHousehold()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [items, setItems] = useState(person.expenses)
  const [localCategories, setLocalCategories] = useState(categories)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creatingForId, setCreatingForId] = useState<string | null>(null)
  const [newEmoji, setNewEmoji] = useState('📦')
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const openLabel = localCategories.find((c) => c.key === openCategory)
  const itemsInOpenCategory = items.filter((e) => e.category === openCategory)

  async function handleRecategorize(expenseId: string, newCategory: string) {
    setSavingId(expenseId)
    setItems((prev) => prev.map((e) => (e.id === expenseId ? { ...e, category: newCategory } : e)))
    await supabase.from('expenses').update({ category: newCategory }).eq('id', expenseId)
    setSavingId(null)
    router.refresh()
  }

  function handleSelectChange(expenseId: string, value: string) {
    if (value === NEW_CATEGORY_VALUE) {
      setCreatingForId(expenseId)
      setNewEmoji('📦')
      setNewLabel('')
      setCreateError(null)
      return
    }
    handleRecategorize(expenseId, value)
  }

  async function handleCreateCategory(expenseId: string) {
    const key = slugify(newLabel)
    if (!key) return
    setCreating(true)
    setCreateError(null)
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        household_id: household.id,
        key,
        label: newLabel.trim(),
        emoji: newEmoji.trim() || '📦',
        sort_order: localCategories.length,
      })
      .select()
      .single()
    setCreating(false)
    if (error || !data) {
      setCreateError(error?.code === '23505' ? 'Já existe uma categoria com esse nome.' : 'Não foi possível criar a categoria.')
      return
    }
    setLocalCategories((prev) => [...prev, { key: data.key, label: data.label, emoji: data.emoji }])
    setCreatingForId(null)
    await handleRecategorize(expenseId, key)
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
      {person.data.length > 0 ? (
        <div className="flex items-center gap-3">
          <div className="w-32 shrink-0">
            <CategoryPieChart data={person.data} total={person.total} size="compact" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col divide-y divide-border">
            {person.data.map((c, i) => {
              const pct = person.total > 0 ? Math.round((c.value / person.total) * 100) : 0
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setOpenCategory(c.key)}
                  className="flex items-center gap-2 py-2 text-left transition-colors hover:bg-surface-2/50"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground/70">
                    {c.emoji} {c.name}
                  </span>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold">{pct}%</p>
                    <p className="font-mono text-[10px] text-foreground/40">{fmtCurrency(c.value)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <CategoryPieChart data={person.data} total={person.total} size="compact" />
      )}

      <BottomSheet
        open={openCategory !== null}
        onClose={() => {
          setOpenCategory(null)
          setCreatingForId(null)
        }}
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
              {creatingForId === e.id ? (
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2/40 p-2">
                  <Input
                    value={newEmoji}
                    onChange={(ev) => setNewEmoji(ev.target.value)}
                    className="w-12 px-2 text-center"
                    maxLength={4}
                  />
                  <Input
                    value={newLabel}
                    onChange={(ev) => setNewLabel(ev.target.value)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') {
                        ev.preventDefault()
                        handleCreateCategory(e.id)
                      }
                    }}
                    placeholder="Nome da categoria"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCreateCategory(e.id)}
                    disabled={creating || !newLabel.trim()}
                  >
                    <Check size={14} />
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setCreatingForId(null)} disabled={creating}>
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <Select
                  value={e.category}
                  disabled={savingId === e.id}
                  onChange={(ev) => handleSelectChange(e.id, ev.target.value)}
                  className="text-xs"
                >
                  {localCategories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY_VALUE}>➕ Nova categoria</option>
                </Select>
              )}
              {creatingForId === e.id && createError && (
                <p className="text-xs text-accent-red">{createError}</p>
              )}
            </div>
          ))}
        </div>
      </BottomSheet>
    </Card>
  )
}
