import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui'
import { MonthlyBarChart, CategoryPieChart } from '@/components/reports-charts'
import { Sparkline } from '@/components/sparkline'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import { fmtCurrency } from '@/lib/format'
import { PIE_COLORS } from '@/lib/chart-colors'
import { BarChart2 } from 'lucide-react'

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

  const [{ data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from('incomes').select('*').eq('household_id', householdId).gte('date', rangeStart),
    supabase.from('expenses').select('*').eq('household_id', householdId).gte('due_date', rangeStart),
  ])

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

  for (const income of incomes ?? []) {
    const key = income.date.slice(0, 7)
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.renda += Number(income.amount)
  }
  for (const expense of expenses ?? []) {
    if (!expense.due_date) continue
    const key = expense.due_date.slice(0, 7)
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.despesas += Number(expense.amount)
  }

  const monthKeys = months.map((m) => m.key)
  const byCategory = new Map<string, number>()
  const categoryMonthly = new Map<string, number[]>()
  for (const expense of expenses ?? []) {
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
      name: EXPENSE_CATEGORIES[key as ExpenseCategory]?.label ?? key,
      emoji: EXPENSE_CATEGORIES[key as ExpenseCategory]?.emoji ?? '💳',
      value,
      trend: categoryMonthly.get(key) ?? new Array(months.length).fill(0),
    }))
    .sort((a, b) => b.value - a.value)

  const totalIncome6m = months.reduce((s, m) => s + m.renda, 0)
  const totalExpense6m = months.reduce((s, m) => s + m.despesas, 0)
  const avgSavings = (totalIncome6m - totalExpense6m) / 6

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in-up">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BarChart2 size={18} className="text-accent-blue" /> Relatórios
        </h2>
        <p className="text-sm text-foreground/45">Panorama dos últimos 6 meses</p>
      </div>

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
    </div>
  )
}
