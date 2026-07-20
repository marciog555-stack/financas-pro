'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { Button, Card, EmptyState, Input, Label } from '@/components/ui'
import { fmtCurrency, fmtDate } from '@/lib/format'
import { GOAL_COLORS } from '@/lib/categories'
import { cn } from '@/lib/cn'
import type { Tables } from '@/lib/database.types'

type Goal = Tables<'goals'>

export default function MetasPage() {
  const { household } = useHousehold()
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Nova meta</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="col-span-2">
            <Label>Nome</Label>
            <Input
              placeholder="Viagem, reserva de emergência…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
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
          <div>
            <Label>Prazo</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2 sm:col-span-3">
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
          <div className="col-span-2 flex items-end justify-end sm:col-span-2">
            <Button type="submit" disabled={saving}>
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Suas metas</h2>
        {loading ? (
          <div className="flex justify-center py-8 text-foreground/40">
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : goals.length === 0 ? (
          <EmptyState title="Nenhuma meta ainda" description="Crie sua primeira meta de economia acima." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)
              )
              return (
                <div key={goal.id} className="rounded-xl border border-black/5 p-4 dark:border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{goal.name}</p>
                      {goal.target_date && (
                        <p className="text-xs text-foreground/40">Até {fmtDate(goal.target_date)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-foreground/30 transition-colors hover:text-red-500"
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: goal.color ?? '#10B981' }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-mono font-semibold">{fmtCurrency(Number(goal.current_amount))}</span>
                    <span className="text-foreground/40">
                      de {fmtCurrency(Number(goal.target_amount))} · {pct}%
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
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
      </Card>
    </div>
  )
}
