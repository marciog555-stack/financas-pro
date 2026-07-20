'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, RefreshCw, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold, ownerLabel } from '@/lib/household-context'
import { OwnerSelect } from '@/components/owner-select'
import { Button, Card, EmptyState, Input, Label, Select } from '@/components/ui'
import { BottomSheet } from '@/components/bottom-sheet'
import { fmtCurrency } from '@/lib/format'
import { BENEFIT_TYPES, type BenefitType } from '@/lib/categories'
import type { Tables } from '@/lib/database.types'

type Benefit = Tables<'benefit_cards'>

export default function BeneficiosPage() {
  const { profile, household, members } = useHousehold()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
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

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSheetOpen(true)
      router.replace('/beneficios')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase.from('benefit_cards').insert({
      household_id: household.id,
      name: form.name,
      type: form.type,
      balance: Number(form.balance || 0),
      owner_profile_id: form.owner || null,
    })
    setSaving(false)
    if (error) {
      setSaveError('Não foi possível salvar. Verifique sua conexão e tente novamente.')
      return
    }
    setForm({ name: '', type: 'VR', balance: '', owner: profile.id })
    setSheetOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    setBenefits((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('benefit_cards').delete().eq('id', id)
  }

  const total = benefits.reduce((sum, b) => sum + Number(b.balance), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Wallet size={18} className="text-accent-orange" /> Benefícios
          </h2>
          <p className="text-sm text-foreground/45">{fmtCurrency(total)} em saldo</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus size={16} /> Benefício
        </Button>
      </div>

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        {loading ? (
          <div className="flex justify-center py-8 text-foreground/40">
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : benefits.length === 0 ? (
          <EmptyState title="Nenhum benefício ainda" description="Adicione VR, VA ou outro cartão." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="rounded-2xl border border-border bg-surface-2/40 p-4">
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
                  <button
                    onClick={() => handleDelete(benefit.id)}
                    className="text-foreground/25 transition-colors hover:text-accent-red"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="mt-3 font-mono text-lg font-semibold text-accent-orange">
                  {fmtCurrency(Number(benefit.balance))}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Novo benefício">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 pb-2">
          <div>
            <Label>Nome do cartão</Label>
            <Input
              placeholder="VR Sodexo, VA Flash…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div>
            <Label>Dono</Label>
            <OwnerSelect value={form.owner} onChange={(owner) => setForm({ ...form, owner })} />
          </div>
          {saveError && <p className="text-xs text-accent-red">{saveError}</p>}
          <Button type="submit" disabled={saving} className="mt-2">
            <Plus size={16} /> Adicionar
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
