'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, RefreshCw, Target, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { Button, EmptyState, Input, Label } from '@/components/ui'
import { BottomSheet } from '@/components/bottom-sheet'
import { ProgressBar } from '@/components/progress-bar'
import { AnimatedNumber } from '@/components/animated-number'
import { fmtCurrency, fmtDate } from '@/lib/format'
import { GOAL_COLORS } from '@/lib/categories'
import { cn } from '@/lib/cn'
import type { Tables } from '@/lib/database.types'

type Goal = Tables<'goals'>

export default function MetasPage() {
  const { household } = useHousehold()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    color: GOAL_COLORS[0],
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSheetOpen(true)
      router.replace('/metas')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.targetAmount) return
    setSaving(true)
    const { error } = await supabase.from('goals').insert({
      household_id: household.id,
      name: form.name,
      target_amount: Number(form.targetAmount),
      current_amount: Number(form.currentAmount || 0),
      target_date: form.deadline || null,
      color: form.color,
    })
    setSaving(false)
    if (!error) {
      setForm({ name: '', targetAmount: '', currentAmount: '', deadline: '', color: GOAL_COLORS[0] })
      setSheetOpen(false)
      load()
    }
  }

  async function addToGoal(goal: Goal, delta: number) {
    const newAmount = Math.max(0, Number(goal.current_amount) + delta)
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, current_amount: newAmount } : g)))
    await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goal.id)
  }

  async function handleDelete(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    await supabase.from('goals').delete().eq('id', id)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Trophy size={18} className="text-accent-purple" /> Suas conquistas
          </h2>
          <p className="text-sm text-foreground/45">Cada meta é um passo rumo aos seus objetivos.</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus size={16} /> Meta
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-foreground/40">
          <RefreshCw className="animate-spin" size={18} />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState title="Nenhuma meta ainda" description="Crie sua primeira meta de economia." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal, i) => {
            const target = Number(goal.target_amount)
            const current = Number(goal.current_amount)
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
            const remaining = Math.max(0, target - current)
            const color = goal.color ?? '#10B981'
            const achieved = pct >= 100
            return (
              <div
                key={goal.id}
                className="animate-fade-in-up rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      {achieved ? <Trophy size={20} /> : <Target size={20} />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{goal.name}</p>
                      {goal.target_date && (
                        <p className="text-xs text-foreground/40">Previsão: {fmtDate(goal.target_date)}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-foreground/25 transition-colors hover:text-accent-red"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-4">
                  <ProgressBar value={pct} barColor={color} className="h-2.5" />
                  <div className="mt-2 flex items-center justify-between text-xs text-foreground/40">
                    <span className="font-mono text-base font-semibold text-foreground">
                      <AnimatedNumber value={current} />
                    </span>
                    <span className="font-semibold" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-foreground/45">
                  <span>Meta de {fmtCurrency(target)}</span>
                  <span>Faltam {fmtCurrency(remaining)}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => addToGoal(goal, 50)}>
                    + R$ 50
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => addToGoal(goal, 200)}>
                    + R$ 200
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova meta">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 pb-2">
          <div>
            <Label>Nome</Label>
            <Input
              placeholder="Viagem, reserva de emergência…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor alvo</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Já guardado</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Prazo</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="mb-0">Cor</Label>
            <div className="flex gap-1.5">
              {GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-transform',
                    form.color === color ? 'scale-110 border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
          <Button type="submit" disabled={saving} className="mt-2">
            <Plus size={16} /> Criar meta
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
