'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile, ownerLabel } from '@/lib/profile-context'
import { OwnerSelect } from '@/components/owner-select'
import { Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { fmtCurrency } from '@/lib/format'
import type { Tables } from '@/lib/database.types'

type Loan = Tables<'loans'>

export default function EmprestimosPage() {
  const profile = useProfile()
  const supabase = createClient()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    totalAmount: '',
    interestRate: '',
    totalInstallments: '',
    remainingInstallments: '',
    monthlyPayment: '',
    owner: 'me',
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
    setLoans(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.totalAmount || !form.totalInstallments || !form.monthlyPayment) return
    setSaving(true)
    const { error } = await supabase.from('loans').insert({
      profile_id: profile.id,
      name: form.name,
      total_amount: Number(form.totalAmount),
      interest_rate: Number(form.interestRate || 0),
      total_installments: Number(form.totalInstallments),
      remaining_installments: Number(form.remainingInstallments || form.totalInstallments),
      monthly_payment: Number(form.monthlyPayment),
      owner: form.owner,
    })
    setSaving(false)
    if (!error) {
      setForm({
        name: '',
        totalAmount: '',
        interestRate: '',
        totalInstallments: '',
        remainingInstallments: '',
        monthlyPayment: '',
        owner: 'me',
      })
      load()
    }
  }

  async function handleDelete(id: string) {
    setLoans((prev) => prev.filter((l) => l.id !== id))
    await supabase.from('loans').delete().eq('id', id)
  }

  const totalOwed = loans.reduce(
    (sum, l) => sum + Number(l.monthly_payment) * l.remaining_installments,
    0
  )
  const totalMonthly = loans.reduce((sum, l) => sum + Number(l.monthly_payment), 0)

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Novo empréstimo / parcelamento</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-3">
            <Label>Nome</Label>
            <Input
              placeholder="Notebook parcelado, empréstimo pessoal…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Valor total</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.totalAmount}
              onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Juros (% a.m.)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
            />
          </div>
          <div>
            <Label>Parcela mensal</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.monthlyPayment}
              onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Total de parcelas</Label>
            <Input
              type="number"
              min="1"
              value={form.totalInstallments}
              onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Parcelas restantes</Label>
            <Input
              type="number"
              min="0"
              placeholder={form.totalInstallments || '—'}
              value={form.remainingInstallments}
              onChange={(e) => setForm({ ...form, remainingInstallments: e.target.value })}
            />
          </div>
          <div>
            <Label>Dono</Label>
            <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-3">
            <Button type="submit" disabled={saving} className="ml-auto">
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Empréstimos ativos</h2>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-red-500">{fmtCurrency(totalOwed)} restante</p>
            <p className="text-xs text-foreground/40">{fmtCurrency(totalMonthly)}/mês</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8 text-foreground/40">
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : loans.length === 0 ? (
          <EmptyState title="Nenhum empréstimo ainda" description="Adicione um parcelamento ou empréstimo acima." />
        ) : (
          <div className="flex flex-col divide-y divide-black/5 dark:divide-white/10">
            {loans.map((loan) => {
              const progress = Math.round(
                ((loan.total_installments - loan.remaining_installments) / loan.total_installments) * 100
              )
              return (
                <div key={loan.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{loan.name}</p>
                      <p className="text-xs text-foreground/40">
                        {loan.total_installments - loan.remaining_installments}/{loan.total_installments} parcelas ·{' '}
                        {Number(loan.interest_rate)}% a.m. · {ownerLabel(profile, loan.owner)}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      {fmtCurrency(Number(loan.monthly_payment))}/mês
                    </span>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="text-foreground/30 transition-colors hover:text-red-500"
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
