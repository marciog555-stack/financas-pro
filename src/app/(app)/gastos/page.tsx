import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui'
import { fmtCurrency, fmtDate } from '@/lib/format'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import { ownerLabel } from '@/lib/owner-label'
import { Receipt } from 'lucide-react'

export default async function GastosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.household_id) redirect('/onboarding')

  const householdId = profile.household_id

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [{ data: members }, { data: expenses }, { data: benefitTransactions }, { data: benefitCards }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('household_id', householdId).order('created_at'),
      supabase
        .from('expenses')
        .select('*')
        .eq('household_id', householdId)
        .gte('due_date', monthStart)
        .lte('due_date', monthEnd),
      supabase
        .from('benefit_transactions')
        .select('*')
        .eq('household_id', householdId)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      supabase.from('benefit_cards').select('*').eq('household_id', householdId),
    ])

  const cardById = new Map((benefitCards ?? []).map((c) => [c.id, c]))

  type Entry = {
    id: string
    date: string
    description: string
    amount: number
    source: string
    ownerProfileId: string | null
    emoji: string
  }

  const fromExpenses: Entry[] = (expenses ?? []).map((e) => {
    const cat = EXPENSE_CATEGORIES[e.category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
    return {
      id: `expense-${e.id}`,
      date: e.due_date ?? monthStart,
      description: e.name,
      amount: Number(e.amount),
      source: 'Dinheiro',
      ownerProfileId: e.owner_profile_id,
      emoji: cat.emoji,
    }
  })

  const fromBenefits: Entry[] = (benefitTransactions ?? []).map((t) => {
    const cat = t.category ? EXPENSE_CATEGORIES[t.category as ExpenseCategory] : null
    const card = cardById.get(t.benefit_card_id)
    return {
      id: `benefit-${t.id}`,
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      source: card?.name ?? 'Benefício',
      ownerProfileId: t.owner_profile_id,
      emoji: cat?.emoji ?? '🎫',
    }
  })

  const entries = [...fromExpenses, ...fromBenefits].sort((a, b) => (a.date < b.date ? 1 : -1))

  const totalDinheiro = fromExpenses.reduce((s, e) => s + e.amount, 0)
  const totalBeneficios = fromBenefits.reduce((s, e) => s + e.amount, 0)
  const totalGeral = totalDinheiro + totalBeneficios

  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in-up">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Receipt size={18} className="text-foreground/70" /> Gastos
        </h2>
        <p className="text-sm text-foreground/45 capitalize">Extrato de {monthLabel}</p>
      </div>

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        <p className="text-xs text-foreground/50">Total gasto no mês</p>
        <p className="mt-1 font-mono text-2xl font-semibold">{fmtCurrency(totalGeral)}</p>
        <div className="mt-4 flex gap-6 border-t border-border pt-3">
          <div>
            <p className="text-[11px] text-foreground/45">Dinheiro</p>
            <p className="font-mono text-sm font-semibold text-accent-red">{fmtCurrency(totalDinheiro)}</p>
          </div>
          <div>
            <p className="text-[11px] text-foreground/45">Benefícios</p>
            <p className="font-mono text-sm font-semibold text-accent-orange">{fmtCurrency(totalBeneficios)}</p>
          </div>
        </div>
      </Card>

      <Card className="animate-fade-in-up [animation-delay:120ms]">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/40">Nenhum gasto registrado este mês.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base">
                  {entry.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.description}</p>
                  <p className="truncate text-xs text-foreground/40">
                    {fmtDate(entry.date)} · {entry.source} · {ownerLabel(members ?? [], entry.ownerProfileId)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold text-accent-red">
                  − {fmtCurrency(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
