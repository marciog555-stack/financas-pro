'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, RefreshCw, CheckCircle2, Circle, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { OwnerSelect } from '@/components/owner-select'
import { Button, Card, EmptyState, Input, Label, Select, Badge } from '@/components/ui'
import { BottomSheet } from '@/components/bottom-sheet'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import type { Tables } from '@/lib/database.types'

type Expense = Tables<'expenses'>

export default function DespesasPage() {
  const { household, members } = useHousehold()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDate: todayISO(),
    category: 'other' as ExpenseCategory,
    owner: '',
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('household_id', household.id)
      .order('due_date', { ascending: true })
    setExpenses(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSheetOpen(true)
      router.replace('/despesas')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.amount) return
    setSaving(true)
    const { error } = await supabase.from('expenses').insert({
      household_id: household.id,
      name: form.name,
      amount: Number(form.amount),
      due_date: form.dueDate,
      category: form.category,
      owner_profile_id: form.owner || null,
      is_paid: false,
    })
    setSaving(false)
    if (!error) {
      setForm({ name: '', amount: '', dueDate: todayISO(), category: 'other', owner: '' })
      setSheetOpen(false)
      load()
    }
  }

  async function togglePaid(expense: Expense) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expense.id ? { ...e, is_paid: !e.is_paid } : e))
    )
    await supabase.from('expenses').update({ is_paid: !expense.is_paid }).eq('id', expense.id)
  }

  async function handleDelete(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    await supabase.from('expenses').delete().eq('id', id)
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const pending = expenses.filter((e) => !e.is_paid).reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <CreditCard size={18} className="text-accent-red" /> Despesas
          </h2>
          <p className="text-sm text-foreground/45">
            {fmtCurrency(total)} no total · {fmtCurrency(pending)} pendente
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus size={16} /> Despesa
        </Button>
      </div>

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        {loading ? (
          <div className="flex justify-center py-8 text-foreground/40">
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState title="Nenhuma despesa ainda" description="Adicione sua primeira conta." />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {expenses.map((expense) => {
              const cat = EXPENSE_CATEGORIES[expense.category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
              return (
                <div key={expense.id} className="flex items-center gap-3 py-3">
                  <button onClick={() => togglePaid(expense)} aria-label="Marcar como pago">
                    {expense.is_paid ? (
                      <CheckCircle2 className="text-accent-emerald" size={20} />
                    ) : (
                      <Circle className="text-foreground/20" size={20} />
                    )}
                  </button>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base">
                    {cat.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{expense.name}</p>
                    <p className="text-xs text-foreground/40">
                      Vence {fmtDate(expense.due_date)} · {ownerLabel(members, expense.owner_profile_id)}
                    </p>
                  </div>
                  {!expense.is_paid && <Badge tone="warning">Pendente</Badge>}
                  <span className="font-mono text-sm font-semibold">
                    {fmtCurrency(Number(expense.amount))}
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-foreground/25 transition-colors hover:text-accent-red"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova despesa">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 pb-2">
          <div>
            <Label>Nome</Label>
            <Input
              placeholder="Aluguel, mercado…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
            >
              {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>
                  {emoji} {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Dono</Label>
            <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} includeShared />
          </div>
          <Button type="submit" disabled={saving} className="mt-2">
            <Plus size={16} /> Adicionar
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
