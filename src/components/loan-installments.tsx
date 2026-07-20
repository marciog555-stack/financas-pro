'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { Badge } from '@/components/ui'
import type { Tables } from '@/lib/database.types'

type Installment = Tables<'loan_installments'>

export function LoanInstallments({ loanId, onToggle }: { loanId: string; onToggle?: () => void }) {
  const supabase = createClient()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('loan_installments')
      .select('*')
      .eq('loan_id', loanId)
      .order('number')
    setInstallments(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId])

  async function togglePaid(inst: Installment) {
    const nextPaid = !inst.is_paid
    const paidDate = nextPaid ? inst.paid_date ?? todayISO() : null
    setInstallments((prev) =>
      prev.map((i) => (i.id === inst.id ? { ...i, is_paid: nextPaid, paid_date: paidDate } : i))
    )
    await supabase
      .from('loan_installments')
      .update({ is_paid: nextPaid, paid_date: paidDate })
      .eq('id', inst.id)
    onToggle?.()
  }

  async function updatePaidDate(inst: Installment, date: string) {
    setInstallments((prev) => prev.map((i) => (i.id === inst.id ? { ...i, paid_date: date } : i)))
    await supabase.from('loan_installments').update({ paid_date: date }).eq('id', inst.id)
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
