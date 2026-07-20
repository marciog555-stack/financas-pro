'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, RefreshCw, TrendingUp, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { OwnerSelect } from '@/components/owner-select'
import { AttachmentField } from '@/components/attachment-field'
import { AttachmentLink } from '@/components/attachment-link'
import { Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { BottomSheet } from '@/components/bottom-sheet'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { uploadAttachment } from '@/lib/attachments'
import type { Tables } from '@/lib/database.types'

type Income = Tables<'incomes'>
type Deduction = { label: string; amount: number }

function parseDeductions(value: Income['deductions']): Deduction[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (d): d is Deduction =>
      typeof d === 'object' && d !== null && 'label' in d && 'amount' in d
  )
}

export default function RendaPage() {
  const { profile, household, members } = useHousehold()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [grossAmount, setGrossAmount] = useState('')
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [form, setForm] = useState({
    source: '',
    amount: '',
    date: todayISO(),
    isRecurring: false,
    owner: profile.id,
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('incomes')
      .select('*')
      .eq('household_id', household.id)
      .order('date', { ascending: false })
    setIncomes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSheetOpen(true)
      router.replace('/renda')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function handleExtract() {
    if (!attachment) return
    setExtracting(true)
    setExtractError(null)
    try {
      const body = new FormData()
      body.append('file', attachment)
      const res = await fetch('/api/income/extract', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao extrair dados')
      setForm((f) => ({
        ...f,
        source: data.source ?? f.source,
        amount: data.net_amount != null ? String(data.net_amount) : f.amount,
        date: data.date ?? f.date,
      }))
      setGrossAmount(data.gross_amount != null ? String(data.gross_amount) : '')
      setDeductions(Array.isArray(data.deductions) ? data.deductions : [])
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Falha ao extrair dados')
    } finally {
      setExtracting(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.source || !form.amount) return
    setSaving(true)
    let attachmentPath: string | null = null
    if (attachment && profile.user_id) {
      attachmentPath = await uploadAttachment(supabase, profile.user_id, 'incomes', attachment)
    }
    const { error } = await supabase.from('incomes').insert({
      household_id: household.id,
      source: form.source,
      amount: Number(form.amount),
      date: form.date,
      is_recurring: form.isRecurring,
      owner_profile_id: form.owner || null,
      attachment_path: attachmentPath,
      gross_amount: grossAmount ? Number(grossAmount) : null,
      deductions: deductions.length > 0 ? deductions : null,
    })
    setSaving(false)
    if (!error) {
      setForm({ source: '', amount: '', date: todayISO(), isRecurring: false, owner: profile.id })
      setAttachment(null)
      setGrossAmount('')
      setDeductions([])
      setSheetOpen(false)
      load()
    }
  }

  async function handleDelete(id: string) {
    setIncomes((prev) => prev.filter((i) => i.id !== id))
    await supabase.from('incomes').delete().eq('id', id)
  }

  const total = incomes.reduce((sum, i) => sum + Number(i.amount), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <TrendingUp size={18} className="text-accent-emerald" /> Receitas
          </h2>
          <p className="text-sm text-foreground/45">{fmtCurrency(total)} registrados</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus size={16} /> Receita
        </Button>
      </div>

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        {loading ? (
          <div className="flex justify-center py-8 text-foreground/40">
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : incomes.length === 0 ? (
          <EmptyState title="Nenhuma entrada ainda" description="Adicione sua primeira renda." />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {incomes.map((income) => {
              const incomeDeductions = parseDeductions(income.deductions)
              const hasBreakdown = income.gross_amount != null || incomeDeductions.length > 0
              const expanded = expandedId === income.id
              return (
                <div key={income.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-emerald/10 text-accent-emerald">
                      <TrendingUp size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{income.source}</p>
                      <p className="text-xs text-foreground/40">
                        {fmtDate(income.date)} · {ownerLabel(members, income.owner_profile_id)}
                        {income.is_recurring ? ' · recorrente' : ''}
                      </p>
                      {income.attachment_path && <AttachmentLink path={income.attachment_path} />}
                    </div>
                    <span className="font-mono text-sm font-semibold text-accent-emerald">
                      {fmtCurrency(Number(income.amount))}
                    </span>
                    {hasBreakdown && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : income.id)}
                        className="text-foreground/40 transition-colors hover:text-foreground"
                        aria-label="Ver detalhamento"
                      >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="text-foreground/25 transition-colors hover:text-accent-red"
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {hasBreakdown && expanded && (
                    <div className="mt-3 rounded-2xl border border-border bg-surface-2/30 p-3 text-xs">
                      {income.gross_amount != null && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-foreground/60">Valor bruto</span>
                          <span className="font-mono font-medium">{fmtCurrency(Number(income.gross_amount))}</span>
                        </div>
                      )}
                      {incomeDeductions.map((d, i) => (
                        <div key={i} className="flex items-center justify-between py-1 text-foreground/60">
                          <span>{d.label}</span>
                          <span className="font-mono text-accent-red">− {fmtCurrency(Number(d.amount))}</span>
                        </div>
                      ))}
                      <div className="mt-1 flex items-center justify-between border-t border-border pt-2 font-medium">
                        <span>Valor líquido</span>
                        <span className="font-mono text-accent-emerald">{fmtCurrency(Number(income.amount))}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova entrada">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 pb-2">
          <div>
            <AttachmentField label="Contracheque (opcional)" file={attachment} onChange={setAttachment} />
            {attachment && (
              <div className="mt-2 flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleExtract} disabled={extracting}>
                  <Sparkles size={14} />
                  {extracting ? 'Lendo contracheque…' : 'Preencher com IA'}
                </Button>
                {extractError && <span className="text-xs text-accent-red">{extractError}</span>}
              </div>
            )}
            {(grossAmount || deductions.length > 0) && (
              <div className="mt-2 rounded-2xl border border-border bg-surface-2/30 p-3 text-xs">
                {grossAmount && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-foreground/60">Valor bruto</span>
                    <span className="font-mono font-medium">{fmtCurrency(Number(grossAmount))}</span>
                  </div>
                )}
                {deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-foreground/60">
                    <span>{d.label}</span>
                    <span className="font-mono text-accent-red">− {fmtCurrency(Number(d.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label>Origem</Label>
            <Input
              placeholder="Salário, freelance…"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
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
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label>Dono</Label>
            <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            />
            Recorrente
          </label>
          <Button type="submit" disabled={saving} className="mt-2">
            <Plus size={16} /> Adicionar
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
