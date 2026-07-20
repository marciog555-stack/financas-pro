'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { OwnerSelect } from '@/components/owner-select'
import { Button, Card, EmptyState, Input, Label, Select } from '@/components/ui'
import { fmtCurrency } from '@/lib/format'
import { BENEFIT_TYPES, type BenefitType } from '@/lib/categories'
import type { Tables } from '@/lib/database.types'

type Benefit = Tables<'benefit_cards'>

export default function BeneficiosPage() {
  const { profile, household, members } = useHousehold()
  const supabase = createClient()
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'VR' as BenefitType,
    balance: '',
    owner: profile.id,
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('benefit_cards')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
    setBenefits(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    const { error } = await supabase.from('benefit_cards').insert({
      household_id: household.id,
      name: form.name,
      type: form.type,
      balance: Number(form.balance || 0),
      owner_profile_id: form.owner || null,
    })
    setSaving(false)
    if (!error) {
      setForm({ name: '', type: 'VR', balance: '', owner: profile.id })
      load()
    }
  }

  async function handleDelete(id: string) {
    setBenefits((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('benefit_cards').delete().eq('id', id)
  }

  const total = benefits.reduce((sum, b) => sum + Number(b.balance), 0)

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Novo benefício</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="col-span-2">
            <Label>Nome do cartão</Label>
            <Input
              placeholder="VR Sodexo, VA Flash…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as BenefitType })}>
              {Object.entries(BENEFIT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Saldo</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
            />
          </div>
          <div>
            <Label>Dono</Label>
            <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-5">
            <Button type="submit" disabled={saving} className="ml-auto">
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Cartões e saldos</h2>
          <span className="font-mono text-sm font-semibold">{fmtCurrency(total)}</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8 text-foreground/40">
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : benefits.length === 0 ? (
          <EmptyState title="Nenhum benefício ainda" description="Adicione VR, VA ou outro cartão acima." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className="rounded-xl border border-black/5 p-4 dark:border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{benefit.name}</p>
                    <p className="text-xs text-foreground/40">
                      {BENEFIT_TYPES[benefit.type as BenefitType] ?? benefit.type} · {ownerLabel(members, benefit.owner_profile_id)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(benefit.id)}
                    className="text-foreground/30 transition-colors hover:text-red-500"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="mt-3 font-mono text-lg font-semibold text-emerald-600">
                  {fmtCurrency(Number(benefit.balance))}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
