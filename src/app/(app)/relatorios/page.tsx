import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui'
import { MonthlyBarChart, CategoryPieChart } from '@/components/reports-charts'
import { Sparkline } from '@/components/sparkline'
import { PersonCategoryCard } from '@/components/person-category-card'
import { getAvatarUrl } from '@/lib/avatars'
import { fmtCurrency } from '@/lib/format'
import { PIE_COLORS } from '@/lib/chart-colors'
import { BarChart2, ShieldAlert } from 'lucide-react'

export default async function RelatoriosPage() {
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

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const rangeStart = sixMonthsAgo.toISOString().slice(0, 10)

  const householdId = profile.household_id

  const [{ data: allIncomes }, { data: allExpenses }, { data: expenseCategories }, { data: members }] =
    await Promise.all([
      supabase.from('incomes').select('*').eq('household_id', householdId).gte('date', rangeStart),
      supabase.from('expenses').select('*').eq('household_id', householdId).gte('due_date', rangeStart),
      supabase.from('expense_categories').select('*').eq('household_id', householdId),
      supabase.from('profiles').select('*').eq('household_id', householdId).order('created_at'),
    ])

  const categories = expenseCategories ?? []
  const pendingCount =
    (allExpenses ?? []).filter((e) => e.needs_review).length + (allIncomes ?? []).filter((i) => i.needs_review).length
  const expenses = (allExpenses ?? []).filter((e) => !e.needs_review)
  const incomes = (allIncomes ?? []).filter((i) => !i.needs_review)

  const months: { key: string; month: string; renda: number; despesas: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      key,
      month: d.toLocaleDateString('pt-BR', { month: 'short' }),
      renda: 0,
      despesas: 0,
    })
  }

  for (const income of incomes) {
    const key = income.date.slice(0, 7)
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.renda += Number(income.amount)
  }
  for (const expense of expenses) {
    if (!expense.due_date) continue
    const key = expense.due_date.slice(0, 7)
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.despesas += Number(expense.amount)
  }

  const monthKeys = months.map((m) => m.key)
  const byCategory = new Map<string, number>()
  const categoryMonthly = new Map<string, number[]>()
  for (const expense of expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + Number(expense.amount))
    if (!expense.due_date) continue
    const idx = monthKeys.indexOf(expense.due_date.slice(0, 7))
    if (idx === -1) continue
    const trend = categoryMonthly.get(expense.category) ?? new Array(months.length).fill(0)
    trend[idx] += Number(expense.amount)
    categoryMonthly.set(expense.category, trend)
  }
  const categoryData = Array.from(byCategory.entries())
    .map(([key, value]) => ({
      key,
      name: categories.find((c) => c.key === key)?.label ?? key,
      emoji: categories.find((c) => c.key === key)?.emoji ?? '💳',
      value,
      trend: categoryMonthly.get(key) ?? new Array(months.length).fill(0),
    }))
    .sort((a, b) => b.value - a.value)

  const totalIncome6m = months.reduce((s, m) => s + m.renda, 0)
  const totalExpense6m = months.reduce((s, m) => s + m.despesas, 0)
  const avgSavings = (totalIncome6m - totalExpense6m) / 6

  function categoryDataFor(ownerId: string) {
    const byOwnerCategory = new Map<string, number>()
    for (const expense of expenses) {
      if (expense.owner_profile_id !== ownerId) continue
      byOwnerCategory.set(expense.category, (byOwnerCategory.get(expense.category) ?? 0) + Number(expense.amount))
    }
    return Array.from(byOwnerCategory.entries())
      .map(([key, value]) => ({
        key,
        name: categories.find((c) => c.key === key)?.label ?? key,
        emoji: categories.find((c) => c.key === key)?.emoji ?? '💳',
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }

  const peopleCategoryData = (members ?? []).map((m) => {
    const data = categoryDataFor(m.id)
    return {
      id: m.id,
      name: m.name || 'Sem nome',
      avatarUrl: getAvatarUrl(m.avatar_path),
      data,
      total: data.reduce((s, c) => s + c.value, 0),
      expenses: expenses
        .filter((e) => e.owner_profile_id === m.id)
        .map((e) => ({ id: e.id, name: e.name, amount: Number(e.amount), due_date: e.due_date, category: e.category })),
      pendingCount: (allExpenses ?? []).filter((e) => e.owner_profile_id === m.id && e.needs_review).length,
    }
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in-up">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BarChart2 size={18} className="text-accent-blue" /> Relatórios
        </h2>
        <p className="text-sm text-foreground/45">Panorama dos últimos 6 meses</p>
      </div>

      {pendingCount > 0 && (
        <Link href="/auditor" className="block animate-fade-in-up">
          <Card className="flex items-center gap-3 border-accent-orange/30 bg-accent-orange/5">
            <ShieldAlert size={20} className="shrink-0 text-accent-orange" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {pendingCount} {pendingCount === 1 ? 'lançamento aguardando' : 'lançamentos aguardando'} explicação
              </p>
              <p className="text-xs text-foreground/45">
                O Auditor IA marcou {pendingCount === 1 ? 'esse lançamento' : 'esses lançamentos'} como pendente (furo de caixa). Toque para explicar e liberá-{pendingCount === 1 ? 'lo' : 'los'} nos relatórios.
              </p>
            </div>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 animate-fade-in-up [animation-delay:80ms]">
        <Card>
          <p className="text-xs text-foreground/50">Renda média mensal</p>
          <p className="mt-1 font-mono text-lg font-semibold text-accent-emerald">
            {fmtCurrency(totalIncome6m / 6)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Despesa média mensal</p>
          <p className="mt-1 font-mono text-lg font-semibold text-accent-red">
            {fmtCurrency(totalExpense6m / 6)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-foreground/50">Economia média mensal</p>
          <p className={`mt-1 font-mono text-lg font-semibold ${avgSavings >= 0 ? 'text-accent-emerald' : 'text-accent-red'}`}>
            {fmtCurrency(avgSavings)}
          </p>
        </Card>
      </div>

      <Card className="animate-fade-in-up [animation-delay:120ms]">
        <h2 className="mb-3 text-sm font-semibold">Renda x Despesas</h2>
        <MonthlyBarChart data={months} />
      </Card>

      <Card className="animate-fade-in-up [animation-delay:160ms]">
        <h2 className="mb-3 text-sm font-semibold">Despesas por categoria</h2>
        <CategoryPieChart data={categoryData} total={totalExpense6m} />
        {categoryData.length > 0 && (
          <div className="mt-4 flex flex-col divide-y divide-border">
            {categoryData.map((c, i) => (
              <div key={c.key} className="flex items-center gap-3 py-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground/70">
                  {c.emoji} {c.name}
                </span>
                <Sparkline values={c.trend} color={PIE_COLORS[i % PIE_COLORS.length]} />
                <span className="w-24 shrink-0 text-right font-mono text-sm font-medium">
                  {fmtCurrency(c.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {peopleCategoryData.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-fade-in-up [animation-delay:200ms]">
          {peopleCategoryData.map((person) => (
            <PersonCategoryCard key={person.id} person={person} categories={categories} />
          ))}
        </div>
      )}
    </div>
  )
}
