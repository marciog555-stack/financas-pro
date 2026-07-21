'use client'

import { useState } from 'react'
import { Trash2, Pencil, ChevronDown, ChevronUp, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { OwnerSelect } from '@/components/owner-select'
import { AttachmentLink } from '@/components/attachment-link'
import { LoanInstallments } from '@/components/loan-installments'
import { Button, Input, Label } from '@/components/ui'
import { ProgressBar } from '@/components/progress-bar'
import { fmtCurrency } from '@/lib/format'
import type { Tables } from '@/lib/database.types'

type Loan = Tables<'loans'>

export function LoanRow({
  loan,
  onChanged,
  onDeleted,
}: {
  loan: Loan
  onChanged: () => void
  onDeleted: () => void
}) {
  const { members } = useHousehold()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: loan.name,
    totalAmount: String(loan.total_amount),
    interestRate: String(loan.interest_rate),
    monthlyPayment: String(loan.monthly_payment),
    owner: loan.owner_profile_id ?? '',
  })

  const progress = Math.round(
    ((loan.total_installments - loan.remaining_installments) / loan.total_installments) * 100
  )

  async function handleDelete() {
    await supabase.from('loans').delete().eq('id', loan.id)
    onDeleted()
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase
      .from('loans')
      .update({
        name: form.name,
        total_amount: Number(form.totalAmount),
        interest_rate: Number(form.interestRate),
        monthly_payment: Number(form.monthlyPayment),
        owner_profile_id: form.owner || null,
      })
      .eq('id', loan.id)
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{loan.name}</p>
          <p className="truncate text-xs text-foreground/40">
            {loan.total_installments - loan.remaining_installments}/{loan.total_installments} parcelas ·{' '}
            {Number(loan.interest_rate)}% a.m. · {ownerLabel(members, loan.owner_profile_id)}
          </p>
          {loan.attachment_path && <AttachmentLink path={loan.attachment_path} />}
        </div>
        <span className="shrink-0 font-mono text-sm font-semibold">
          {fmtCurrency(Number(loan.monthly_payment))}/mês
        </span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-foreground/40 transition-colors hover:text-foreground"
          aria-label="Ver andamento e editar"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          onClick={handleDelete}
          className="shrink-0 text-foreground/25 transition-colors hover:text-accent-red"
          aria-label="Excluir"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <ProgressBar value={progress} className="mt-2.5 h-1.5" barClassName="bg-accent-blue" />

      {expanded && (
        <div className="mt-3 rounded-2xl border border-border bg-surface-2/30 p-3">
          {editing ? (
            <form onSubmit={handleSaveEdit} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
                <Label>Dono</Label>
                <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
              </div>
              <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
                <Button type="submit" size="sm" disabled={saving}>
                  <Check size={14} /> Salvar
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
                  <X size={14} /> Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)} className="mb-3">
              <Pencil size={14} /> Editar dados do empréstimo
            </Button>
          )}

          <p className="mb-1 text-xs font-medium text-foreground/50">
            Parcelas ({loan.total_installments - loan.remaining_installments}/{loan.total_installments} pagas)
          </p>
          <LoanInstallments loanId={loan.id} onToggle={onChanged} />
        </div>
      )}
    </div>
  )
}
