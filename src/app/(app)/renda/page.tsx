'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, RefreshCw, TrendingUp } from 'lucide-react'
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

export default function RendaPage() {
  const { profile, household, members } = useHousehold()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
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
    })
    setSaving(false)
    if (!error) {
      setForm({ source: '', amount: '', date: todayISO(), isRecurring: false, owner: profile.id })
      setAttachment(null)
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
            {incomes.map((income) => (
              <div key={income.id} className="flex items-center gap-3 py-3">
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
                <button
                  onClick={() => handleDelete(income.id)}
                  className="text-foreground/25 transition-colors hover:text-accent-red"
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova entrada">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 pb-2">
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
          <AttachmentField label="Contracheque (opcional)" file={attachment} onChange={setAttachment} />
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
