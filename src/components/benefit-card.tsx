'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Wallet, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { OwnerSelect } from '@/components/owner-select'
import { Button, Input, Select } from '@/components/ui'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { BENEFIT_TYPES, EXPENSE_CATEGORIES, type BenefitType, type ExpenseCategory } from '@/lib/categories'
import type { Tables } from '@/lib/database.types'

type Benefit = Tables<'benefit_cards'>
type Transaction = Tables<'benefit_transactions'>

export function BenefitCard({
  benefit,
  onChanged,
  onDelete,
}: {
  benefit: Benefit
  onChanged: () => void
  onDelete: () => void
}) {
  const { members } = useHousehold()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: todayISO(),
    category: '',
    owner: benefit.owner_profile_id ?? '',
  })

  async function loadTransactions() {
    setLoadingTx(true)
    const { data } = await supabase
      .from('benefit_transactions')
      .select('*')
      .eq('benefit_card_id', benefit.id)
      .order('date', { ascending: false })
    setTransactions(data ?? [])
    setLoadingTx(false)
  }

  useEffect(() => {
    if (expanded) loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    setSaveError(null)
    const amount = Number(form.amount)
    const { error: txError } = await supabase.from('benefit_transactions').insert({
      household_id: benefit.household_id,
      benefit_card_id: benefit.id,
      description: form.description,
      amount,
      date: form.date,
      category: form.category || null,
      owner_profile_id: form.owner || null,
    })
    if (txError) {
      setSaving(false)
      setSaveError('Não foi possível salvar. Verifique sua conexão e tente novamente.')
      return
    }
    const newBalance = Math.max(0, Number(benefit.balance) - amount)
    await supabase.from('benefit_cards').update({ balance: newBalance }).eq('id', benefit.id)
    setSaving(false)
    setForm({ description: '', amount: '', date: todayISO(), category: '', owner: benefit.owner_profile_id ?? '' })
    setAdding(false)
    loadTransactions()
    onChanged()
  }

  async function handleDeleteTransaction(tx: Transaction) {
    setTransactions((prev) => prev.filter((t) => t.id !== tx.id))
    await supabase.from('benefit_transactions').delete().eq('id', tx.id)
    const restoredBalance = Number(benefit.balance) + Number(tx.amount)
    await supabase.from('benefit_cards').update({ balance: restoredBalance }).eq('id', benefit.id)
    onChanged()
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-orange/10 text-accent-orange">
            <Wallet size={16} />
          </span>
          <div>
            <p className="text-sm font-medium">{benefit.name}</p>
            <p className="text-xs text-foreground/40">
              {BENEFIT_TYPES[benefit.type as BenefitType] ?? benefit.type} ·{' '}
              {ownerLabel(members, benefit.owner_profile_id)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-foreground/40 transition-colors hover:text-foreground"
            aria-label="Ver gastos"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={onDelete}
            className="text-foreground/25 transition-colors hover:text-accent-red"
            aria-label="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="mt-3 font-mono text-lg font-semibold text-accent-orange">
        {fmtCurrency(Number(benefit.balance))}
      </p>

      {expanded && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground/50">Para onde foi o dinheiro</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => setAdding((v) => !v)}>
              <Plus size={14} /> Gasto
            </Button>
          </div>

          {adding && (
            <form onSubmit={handleAddTransaction} className="mb-3 flex flex-col gap-2 rounded-lg bg-surface-2/50 p-2.5">
              <Input
                placeholder="Onde foi gasto (mercado, conta de luz…)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Valor"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Categoria (opcional)</option>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, emoji }]) => (
                    <option key={key} value={key}>
                      {emoji} {label}
                    </option>
                  ))}
                </Select>
                <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} includeShared />
              </div>
              {saveError && <p className="text-xs text-accent-red">{saveError}</p>}
              <Button type="submit" size="sm" disabled={saving}>
                Registrar gasto
              </Button>
            </form>
          )}

          {loadingTx ? (
            <div className="flex justify-center py-4 text-foreground/40">
              <RefreshCw className="animate-spin" size={16} />
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-3 text-center text-xs text-foreground/40">Nenhum gasto registrado ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {transactions.map((tx) => {
                const cat = tx.category ? EXPENSE_CATEGORIES[tx.category as ExpenseCategory] : null
                return (
                  <div key={tx.id} className="flex items-center gap-2 py-2 text-xs">
                    {cat && <span>{cat.emoji}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground/80">{tx.description}</p>
                      <p className="text-foreground/40">
                        {fmtDate(tx.date)} · {ownerLabel(members, tx.owner_profile_id)}
                      </p>
                    </div>
                    <span className="font-mono font-medium text-accent-red">− {fmtCurrency(Number(tx.amount))}</span>
                    <button
                      onClick={() => handleDeleteTransaction(tx)}
                      className="shrink-0 text-foreground/25 transition-colors hover:text-accent-red"
                      aria-label="Excluir gasto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
