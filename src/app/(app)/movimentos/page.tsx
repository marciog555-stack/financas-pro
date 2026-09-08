import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, EmptyState } from '@/components/ui'
import { MonthNav } from '@/components/month-nav'
import { resolveMonth } from '@/lib/month'
import { fmtCurrency, fmtDate } from '@/lib/format'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import { ownerLabel } from '@/lib/owner-label'
import { TrendingUp } from 'lucide-react'

type Row = {
  id: string
  kind: 'expense' | 'income'
  date: string
  title: string
  amount: number
  ownerId: string | null
  emoji: string
}

export default async function MovimentosPage({
  searchParams,
}: {
  searchParams?: { m?: string }
}) {
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

  const { monthStart, monthEnd, monthLabelFull, prevParam, nextParam } = resolveMonth(searchParams?.m)
  const householdId = profile.household_id

  const [{ data: expenses }, { data: incomes }, { data: members }] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('household_id', householdId)
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd),
    supabase
      .from('incomes')
      .select('*')
      .eq('household_id', householdId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase.from('profiles').select('*').eq('household_id', householdId),
  ])

  const rows: Row[] = [
    ...(expenses ?? []).map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      date: e.due_date ?? '',
      title: e.name,
      amount: Number(e.amount),
      ownerId: e.owner_profile_id,
      emoji: (EXPENSE_CATEGORIES[e.category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other).emoji,
    })),
    ...(incomes ?? []).map((i) => ({
      id: i.id,
      kind: 'income' as const,
      date: i.date,
      title: i.source,
      amount: Number(i.amount),
      ownerId: i.owner_profile_id,
      emoji: '',
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  const totalIncome = rows.filter((r) => r.kind === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = rows.filter((r) => r.kind === 'expense').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col gap-5">
      <MonthNav label={monthLabelFull} prevParam={prevParam} nextParam={nextParam} basePath="/movimentos" />

      {rows.length > 0 && (
        <div className="flex gap-3 animate-fade-in-up [animation-delay:40ms]">
          <Card className="flex-1 p-3">
            <p className="text-xs font-medium text-foreground/45">Receitas</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-accent-emerald">
              {fmtCurrency(totalIncome)}
            </p>
          </Card>
          <Card className="flex-1 p-3">
            <p className="text-xs font-medium text-foreground/45">Despesas</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-accent-red">{fmtCurrency(totalExpense)}</p>
          </Card>
        </div>
      )}

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        {rows.length === 0 ? (
          <EmptyState title="Relaxe 🏖️" description="Você não tem movimentos neste período." />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {rows.map((r) => (
              <div key={`${r.kind}-${r.id}`} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
                    r.kind === 'income' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-surface-2'
                  }`}
                >
                  {r.kind === 'income' ? <TrendingUp size={16} /> : r.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-foreground/40">
                    {fmtDate(r.date)} · {ownerLabel(members ?? [], r.ownerId)}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-mono text-sm font-semibold ${
                    r.kind === 'income' ? 'text-accent-emerald' : 'text-accent-red'
                  }`}
                >
                  {r.kind === 'income' ? '+' : '-'}
                  {fmtCurrency(r.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
