'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, RefreshCw, FastForward } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { Badge, Button, Input } from '@/components/ui'
import type { Tables } from '@/lib/database.types'

type Installment = Tables<'loan_installments'>
type Loan = Tables<'loans'>

export function LoanInstallments({ loan, onToggle }: { loan: Loan; onToggle?: () => void }) {
  const supabase = createClient()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [advanceCount, setAdvanceCount] = useState('')
  const [advancing, setAdvancing] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('loan_installments')
      .select('*')
      .eq('loan_id', loan.id)
      .order('number')
    setInstallments(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan.id])

  // Mantém loans.remaining_installments sincronizado com o que foi marcado aqui,
  // já que o resumo "X/Y parcelas" do empréstimo é lido desse campo.
  async function syncRemaining(nextInstallments: Installment[]) {
    const remaining = nextInstallments.filter((i) => !i.is_paid).length
    if (remaining !== loan.remaining_installments) {
      await supabase.from('loans').update({ remaining_installments: remaining }).eq('id', loan.id)
    }
  }

  async function togglePaid(inst: Installment) {
    const nextPaid = !inst.is_paid
    const paidDate = nextPaid ? inst.paid_date ?? todayISO() : null
    const next = installments.map((i) => (i.id === inst.id ? { ...i, is_paid: nextPaid, paid_date: paidDate } : i))
    setInstallments(next)
    await supabase.from('loan_installments').update({ is_paid: nextPaid, paid_date: paidDate }).eq('id', inst.id)
    await syncRemaining(next)
    onToggle?.()
  }

  async function updatePaidDate(inst: Installment, date: string) {
    setInstallments((prev) => prev.map((i) => (i.id === inst.id ? { ...i, paid_date: date } : i)))
    await supabase.from('loan_installments').update({ paid_date: date }).eq('id', inst.id)
  }

  const unpaidCount = installments.filter((i) => !i.is_paid).length

  async function handleAdvance() {
    const count = Number(advanceCount)
    if (!count || count < 1) return
    const toMark = installments
      .filter((i) => !i.is_paid)
      .sort((a, b) => a.number - b.number)
      .slice(0, count)
    if (toMark.length === 0) return

    setAdvancing(true)
    const today = todayISO()
    await supabase
      .from('loan_installments')
      .update({ is_paid: true, paid_date: today })
      .in(
        'id',
        toMark.map((i) => i.id)
      )

    const next = installments.map((i) =>
      toMark.some((t) => t.id === i.id) ? { ...i, is_paid: true, paid_date: today } : i
    )
    setInstallments(next)
    await syncRemaining(next)
    setAdvanceCount('')
    setAdvancing(false)
    onToggle?.()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4 text-foreground/40">
        <RefreshCw className="animate-spin" size={16} />
      </div>
    )
  }

  const early = installments.filter((i) => i.is_paid && i.paid_date && i.paid_date < i.due_date)

  return (
    <div className="flex flex-col gap-2">
      {early.length > 0 && (
        <p className="text-xs text-accent-emerald">
          {early.length} parcela{early.length > 1 ? 's' : ''} paga{early.length > 1 ? 's' : ''} adiantada
          {early.length > 1 ? 's' : ''}: {early.map((i) => `#${i.number}`).join(', ')}
        </p>
      )}

      {unpaidCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-2">
          <FastForward size={14} className="shrink-0 text-foreground/40" />
          <Input
            type="number"
            min={1}
            max={unpaidCount}
            placeholder={`Adiantar quantas? (até ${unpaidCount})`}
            value={advanceCount}
            onChange={(e) => setAdvanceCount(e.target.value)}
            className="flex-1 py-1.5 text-xs"
          />
          <Button type="button" size="sm" onClick={handleAdvance} disabled={advancing || !advanceCount}>
            {advancing ? '...' : 'Marcar pagas'}
          </Button>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
        <div className="flex flex-col divide-y divide-border">
          {installments.map((inst) => {
            const isEarly = Boolean(inst.is_paid && inst.paid_date && inst.paid_date < inst.due_date)
            const isLate = Boolean(inst.is_paid && inst.paid_date && inst.paid_date > inst.due_date)
            return (
              <div key={inst.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                <button onClick={() => togglePaid(inst)} aria-label="Marcar parcela como paga">
                  {inst.is_paid ? (
                    <CheckCircle2 size={16} className="text-accent-emerald" />
                  ) : (
                    <Circle size={16} className="text-foreground/20" />
                  )}
                </button>
                <span className="w-8 shrink-0 font-mono text-foreground/50">#{inst.number}</span>
                <span className="flex-1 text-foreground/70">Vence {fmtDate(inst.due_date)}</span>
                <span className="font-mono">{fmtCurrency(Number(inst.amount))}</span>
                {inst.is_paid && (
                  <input
                    type="date"
                    value={inst.paid_date ?? ''}
                    onChange={(e) => updatePaidDate(inst, e.target.value)}
                    className="rounded-md border border-border bg-transparent px-1 py-0.5 text-[11px]"
                  />
                )}
                {isEarly && <Badge tone="success">Adiantada</Badge>}
                {isLate && <Badge tone="warning">Atrasada</Badge>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
