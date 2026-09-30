'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, RefreshCw, CheckCircle2, Circle, CreditCard, Repeat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { OwnerChips } from '@/components/owner-chips'
import { CategoryGrid } from '@/components/category-grid'
import { AmountInput } from '@/components/amount-input'
import { Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { BottomSheet } from '@/components/bottom-sheet'
import { MonthNav } from '@/components/month-nav'
import { resolveMonth, defaultDateForMonth } from '@/lib/month'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Tables } from '@/lib/database.types'

type Expense = Tables<'expenses'>
type PaidBySplit = { profile_id: string; amount: number }

function parsePaidBy(value: Expense['paid_by']): PaidBySplit[] | null {
  if (!Array.isArray(value)) return null
  const parsed = value.filter(
    (v): v is PaidBySplit =>
      typeof v === 'object' && v !== null && typeof (v as PaidBySplit).profile_id === 'string' && typeof (v as PaidBySplit).amount === 'number'
  )
  return parsed.length > 0 ? parsed : null
}

export default function DespesasPage() {
  const { profile, household, members, categories } = useHousehold()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get('m') ?? undefined
  const { monthStart, monthEnd, monthLabelFull, prevParam, nextParam } = resolveMonth(monthParam)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null)
  const [payYouAmount, setPayYouAmount] = useState('')
  const [payPartnerAmount, setPayPartnerAmount] = useState('')
  const [payingSaving, setPayingSaving] = useState(false)
  const partner = members.find((m) => m.id !== profile.id) ?? null
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDate: defaultDateForMonth(monthStart, monthEnd),
    category: categories[0]?.key ?? 'other',
    owner: '',
    isRecurring: false,
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('household_id', household.id)
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd)
      .order('due_date', { ascending: true })
    setExpenses(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    setForm((f) => ({ ...f, dueDate: defaultDateForMonth(monthStart, monthEnd) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStart, monthEnd])

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
    setSaveError(null)
    const { error } = await supabase.from('expenses').insert({
      household_id: household.id,
      name: form.name,
      amount: Number(form.amount),
      due_date: form.dueDate,
      category: form.category,
      owner_profile_id: form.owner || null,
      is_paid: false,
      is_recurring: form.isRecurring,
    })
    setSaving(false)
    if (error) {
      setSaveError('Não foi possível salvar. Verifique sua conexão e tente novamente.')
      return
    }
    setForm({
      name: '',
      amount: '',
      dueDate: defaultDateForMonth(monthStart, monthEnd),
      category: categories[0]?.key ?? 'other',
      owner: '',
      isRecurring: false,
    })
    setSheetOpen(false)
    load()
  }

  async function togglePaid(expense: Expense) {
    if (!expense.is_paid && !expense.owner_profile_id && partner) {
      const total = Number(expense.amount)
      const youPct = profile.split_percentage ?? 50
      setPayingExpense(expense)
      setPayYouAmount(((total * youPct) / 100).toFixed(2))
      setPayPartnerAmount((total - (total * youPct) / 100).toFixed(2))
      return
    }
    setExpenses((prev) =>
      prev.map((e) => (e.id === expense.id ? { ...e, is_paid: !e.is_paid } : e))
    )
    await supabase.from('expenses').update({ is_paid: !expense.is_paid }).eq('id', expense.id)
  }

  function handlePayYouChange(value: string) {
    setPayYouAmount(value)
    if (!payingExpense) return
    const remaining = Number(payingExpense.amount) - Number(value || 0)
    setPayPartnerAmount(remaining.toFixed(2))
  }

  function handlePayPartnerChange(value: string) {
    setPayPartnerAmount(value)
    if (!payingExpense) return
    const remaining = Number(payingExpense.amount) - Number(value || 0)
    setPayYouAmount(remaining.toFixed(2))
  }

  async function confirmPaidBySplit() {
    if (!payingExpense || !partner) return
    setPayingSaving(true)
    const paidBy: PaidBySplit[] = [
      { profile_id: profile.id, amount: Number(payYouAmount || 0) },
      { profile_id: partner.id, amount: Number(payPartnerAmount || 0) },
    ]
    const { error } = await supabase
      .from('expenses')
      .update({ is_paid: true, paid_by: paidBy })
      .eq('id', payingExpense.id)
    setPayingSaving(false)
    if (error) return
    setExpenses((prev) =>
      prev.map((e) => (e.id === payingExpense.id ? { ...e, is_paid: true, paid_by: paidBy } : e))
    )
    setPayingExpense(null)
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

      <MonthNav label={monthLabelFull} prevParam={prevParam} nextParam={nextParam} basePath="/despesas" />

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
              const cat = categories.find((c) => c.key === expense.category)
              const overdue = !expense.is_paid && Boolean(expense.due_date && expense.due_date < todayISO())
              return (
                <div key={expense.id} className="flex items-center gap-2.5 py-3">
                  <button onClick={() => togglePaid(expense)} aria-label="Marcar como pago" className="shrink-0">
                    {expense.is_paid ? (
                      <CheckCircle2 className="text-accent-emerald" size={20} />
                    ) : (
                      <Circle className={overdue ? 'text-accent-red' : 'text-foreground/20'} size={20} />
                    )}
                  </button>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base">
                    {cat?.emoji ?? '📦'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-medium">
                      {expense.name}
                      {expense.is_recurring && (
                        <Repeat size={11} className="shrink-0 text-foreground/30" aria-label="Despesa fixa" />
                      )}
                    </p>
                    <p className="truncate text-xs text-foreground/40">
                      {overdue ? 'Venceu' : 'Vence'} {fmtDate(expense.due_date)} ·{' '}
                      {ownerLabel(members, expense.owner_profile_id)}
                      {expense.is_recurring ? ' · fixa' : ''}
                    </p>
                    {(() => {
                      const paidBy = parsePaidBy(expense.paid_by)
                      if (!paidBy) return null
                      return (
                        <p className="truncate text-xs text-foreground/35">
                          {paidBy
                            .filter((p) => p.amount > 0)
                            .map((p) => `${ownerLabel(members, p.profile_id)} pagou ${fmtCurrency(p.amount)}`)
                            .join(' · ')}
                        </p>
                      )
                    })()}
                  </div>
                  <span className={cn('shrink-0 font-mono text-sm font-semibold', overdue && 'text-accent-red')}>
                    {fmtCurrency(Number(expense.amount))}
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="shrink-0 text-foreground/25 transition-colors hover:text-accent-red"
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
        <form onSubmit={handleAdd} className="flex flex-col gap-4 pb-2">
          <AmountInput value={form.amount} onChange={(amount) => setForm({ ...form, amount })} tone="red" />

          <div>
            <Label>Nome</Label>
            <Input
              placeholder="Aluguel, mercado…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Quem pagou?</Label>
            <OwnerChips value={form.owner} onChange={(owner) => setForm({ ...form, owner })} includeShared />
          </div>

          <div>
            <Label>Categoria</Label>
            <CategoryGrid
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
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

          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            />
            Despesa fixa (repete todo mês com o mesmo valor)
          </label>

          {saveError && <p className="text-xs text-accent-red">{saveError}</p>}
          <Button type="submit" disabled={saving} className="mt-2">
            <Plus size={16} /> Adicionar
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={Boolean(payingExpense)} onClose={() => setPayingExpense(null)} title="Quem pagou essa conta?">
        {payingExpense && partner && (
          <div className="flex flex-col gap-4 pb-2">
            <p className="text-sm text-foreground/50">
              {payingExpense.name} · {fmtCurrency(Number(payingExpense.amount))} no total. Diga quanto cada um pagou —
              se só uma pessoa pagou tudo, deixe o valor do outro em 0 (fica pendente pra acertar depois).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{profile.name.split(' ')[0]}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={payYouAmount}
                  onChange={(e) => handlePayYouChange(e.target.value)}
                />
              </div>
              <div>
                <Label>{partner.name.split(' ')[0]}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={payPartnerAmount}
                  onChange={(e) => handlePayPartnerChange(e.target.value)}
                />
              </div>
            </div>
            <Button type="button" disabled={payingSaving} onClick={confirmPaidBySplit}>
              <CheckCircle2 size={16} /> Confirmar pagamento
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
