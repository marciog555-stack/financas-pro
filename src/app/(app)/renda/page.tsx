'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile, ownerLabel } from '@/lib/profile-context'
import { OwnerSelect } from '@/components/owner-select'
import { AttachmentField } from '@/components/attachment-field'
import { AttachmentLink } from '@/components/attachment-link'
import { Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { uploadAttachment } from '@/lib/attachments'
import type { Tables } from '@/lib/database.types'

type Income = Tables<'incomes'>

export default function RendaPage() {
  const profile = useProfile()
  const supabase = createClient()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [form, setForm] = useState({
    source: '',
    amount: '',
    date: todayISO(),
    isRecurring: false,
    owner: 'me',
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('incomes')
      .select('*')
      .eq('profile_id', profile.id)
      .order('date', { ascending: false })
    setIncomes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.source || !form.amount) return
    setSaving(true)
    let attachmentPath: string | null = null
    if (attachment && profile.user_id) {
      attachmentPath = await uploadAttachment(supabase, profile.user_id, 'incomes', attachment)
    }
    const { error } = await supabase.from('incomes').insert({
      profile_id: profile.id,
      source: form.source,
      amount: Number(form.amount),
      date: form.date,
      is_recurring: form.isRecurring,
      owner: form.owner,
      attachment_path: attachmentPath,
    })
    setSaving(false)
    if (!error) {
      setForm({ source: '', amount: '', date: todayISO(), isRecurring: false, owner: 'me' })
      setAttachment(null)
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
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Nova entrada</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-2">
            <Label>Origem</Label>
            <Input
              placeholder="Salário, freelance…"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              required
            />
          </div>
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
          <div>
            <Label>Dono</Label>
            <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <AttachmentField label="Contracheque (opcional)" file={attachment} onChange={setAttachment} />
          </div>
          <div className="col-span-2 flex items-end gap-3 sm:col-span-3">
            <label className="flex items-center gap-2 text-sm text-foreground/70">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              />
              Recorrente
            </label>
            <Button type="submit" disabled={saving} className="ml-auto">
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Entradas registradas</h2>
          <span className="font-mono text-sm font-semibold text-emerald-600">{fmtCurrency(total)}</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8 text-foreground/40">
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : incomes.length === 0 ? (
          <EmptyState title="Nenhuma entrada ainda" description="Adicione sua primeira renda acima." />
        ) : (
          <div className="flex flex-col divide-y divide-black/5 dark:divide-white/10">
            {incomes.map((income) => (
              <div key={income.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{income.source}</p>
                  <p className="text-xs text-foreground/40">
                    {fmtDate(income.date)} · {ownerLabel(profile, income.owner)}
                    {income.is_recurring ? ' · recorrente' : ''}
                  </p>
                  {income.attachment_path && <AttachmentLink path={income.attachment_path} />}
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">
                  {fmtCurrency(Number(income.amount))}
                </span>
                <button
                  onClick={() => handleDelete(income.id)}
                  className="text-foreground/30 transition-colors hover:text-red-500"
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
