import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui'
import { MonthlyBarChart, CategoryPieChart, CashFlowChart } from '@/components/reports-charts'
import { PersonCategoryCard } from '@/components/person-category-card'
import { BudgetAllocationCard } from '@/components/budget-allocation-card'
import { getAvatarUrl } from '@/lib/avatars'
import { fmtCurrency } from '@/lib/format'
import { PIE_COLORS } from '@/lib/chart-colors'
import { cn } from '@/lib/cn'
import { BarChart2, ShieldAlert, ArrowUp, ArrowDown, Users2 } from 'lucide-react'

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams?: { view?: string }
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

  const curMonth = months[months.length - 1]
  const prevMonth = months[months.length - 2]

  function pctChange(cur: number, prev: number): number | null {
    if (prev === 0) return cur === 0 ? 0 : null
    return ((cur - prev) / Math.abs(prev)) * 100
  }

  // --- Helpers parametrizados por dono (null = casa toda / compartilhado) ---

  function categoryDataForMonth(ownerId: string | null) {
    const byCategory = new Map<string, number>()
    for (const expense of expenses) {
      if (!expense.due_date || !expense.due_date.startsWith(curMonth.key)) continue
      if (ownerId !== null && expense.owner_profile_id !== ownerId) continue
      byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + Number(expense.amount))
    }
    return Array.from(byCategory.entries())
      .map(([key, value]) => ({
        key,
        name: categories.find((c) => c.key === key)?.label ?? key,
        emoji: categories.find((c) => c.key === key)?.emoji ?? '💳',
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }

  function cashFlowForOwner(ownerId: string | null) {
    const [curYear, curMonthNum] = curMonth.key.split('-').map(Number)
    const daysInCurMonth = new Date(curYear, curMonthNum, 0).getDate()
    const dailyEntradas = new Array(daysInCurMonth).fill(0)
    const dailySaidas = new Array(daysInCurMonth).fill(0)
    for (const income of incomes) {
      if (!income.date.startsWith(curMonth.key)) continue
      if (ownerId !== null && income.owner_profile_id !== ownerId) continue
      const day = Number(income.date.slice(8, 10))
      if (day >= 1 && day <= daysInCurMonth) dailyEntradas[day - 1] += Number(income.amount)
    }
    for (const expense of expenses) {
      if (!expense.due_date || !expense.due_date.startsWith(curMonth.key)) continue
      if (ownerId !== null && expense.owner_profile_id !== ownerId) continue
      const day = Number(expense.due_date.slice(8, 10))
      if (day >= 1 && day <= daysInCurMonth) dailySaidas[day - 1] += Number(expense.amount)
    }
    let runningIn = 0
    let runningOut = 0
    return dailyEntradas.map((_, idx) => {
      runningIn += dailyEntradas[idx]
      runningOut += dailySaidas[idx]
      return { day: idx + 1, entradas: runningIn, saidas: runningOut }
    })
  }

  function budgetItemsForOwner(ownerId: string | null) {
    const spentByCategory = new Map<string, number>()
    for (const expense of expenses) {
      if (!expense.due_date || !expense.due_date.startsWith(curMonth.key)) continue
      if (ownerId !== null && expense.owner_profile_id !== ownerId) continue
      spentByCategory.set(expense.category, (spentByCategory.get(expense.category) ?? 0) + Number(expense.amount))
    }
    return categories
      .map((c) => ({
        id: c.id,
        key: c.key,
        label: c.label,
        emoji: c.emoji,
        pct: c.budget_pct,
        spent: spentByCategory.get(c.key) ?? 0,
      }))
      .sort((a, b) => {
        const aHas = a.pct != null
        const bHas = b.pct != null
        if (aHas && !bHas) return -1
        if (!aHas && bHas) return 1
        if (aHas && bHas) return b.spent / (b.pct || 1) - a.spent / (a.pct || 1)
        return b.spent - a.spent
      })
  }

  function expenseTotalForOwner(ownerId: string | null, monthKey: string) {
    return expenses
      .filter((e) => e.due_date?.startsWith(monthKey) && (ownerId === null || e.owner_profile_id === ownerId))
      .reduce((s, e) => s + Number(e.amount), 0)
  }

  // --- Tabs: Compartilhado | <membro 1> | <membro 2> ---
  const view = searchParams?.view && (members ?? []).some((m) => m.id === searchParams.view) ? searchParams.view : 'shared'
  const tabs = [
    { id: 'shared', label: 'Compartilhado' },
    ...(members ?? []).map((m) => ({ id: m.id, label: (m.name || 'Sem nome').split(' ')[0] })),
  ]

  // --- Dados da aba "Compartilhado" ---
  const sharedCategoryData = categoryDataForMonth(null)
  const sharedTotalThisMonth = sharedCategoryData.reduce((s, c) => s + c.value, 0)
  const curLucro = curMonth.renda - curMonth.despesas
  const prevLucro = prevMonth.renda - prevMonth.despesas
  const statCards = [
    { label: 'Receita', value: curMonth.renda, pct: pctChange(curMonth.renda, prevMonth.renda), tone: 'emerald' as const },
    { label: 'Despesas', value: curMonth.despesas, pct: pctChange(curMonth.despesas, prevMonth.despesas), tone: 'purple' as const, invert: true },
    { label: 'Lucro Líquido', value: curLucro, pct: pctChange(curLucro, prevLucro), tone: 'blue' as const },
  ]
  const sharedCashFlow = cashFlowForOwner(null)
  const sharedBudgetItems = budgetItemsForOwner(null)

  // --- Dados da aba pessoal (quando selecionada) ---
  const selectedMember = view !== 'shared' ? (members ?? []).find((m) => m.id === view) : null
  let personalView: {
    spentThisMonth: number
    pct: number | null
    avgPerDay: number
    data: { key: string; name: string; emoji: string; value: number }[]
    total: number
    expensesList: { id: string; name: string; amount: number; due_date: string | null; category: string }[]
    pendingCount: number
    cashFlow: { day: number; entradas: number; saidas: number }[]
    budgetItems: ReturnType<typeof budgetItemsForOwner>
  } | null = null

  if (selectedMember) {
    const spentThisMonth = expenseTotalForOwner(selectedMember.id, curMonth.key)
    const spentPrevMonth = expenseTotalForOwner(selectedMember.id, prevMonth.key)
    const data = categoryDataForMonth(selectedMember.id)
    const today = new Date()
    const daysElapsed = curMonth.key === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      ? today.getDate()
      : new Date(Number(curMonth.key.split('-')[0]), Number(curMonth.key.split('-')[1]), 0).getDate()
    personalView = {
      spentThisMonth,
      pct: pctChange(spentThisMonth, spentPrevMonth),
      avgPerDay: spentThisMonth / Math.max(1, daysElapsed),
      data,
      total: data.reduce((s, c) => s + c.value, 0),
      expensesList: expenses
        .filter((e) => e.owner_profile_id === selectedMember.id)
        .map((e) => ({ id: e.id, name: e.name, amount: Number(e.amount), due_date: e.due_date, category: e.category })),
      pendingCount: (allExpenses ?? []).filter((e) => e.owner_profile_id === selectedMember.id && e.needs_review).length,
      cashFlow: cashFlowForOwner(selectedMember.id),
      budgetItems: budgetItemsForOwner(selectedMember.id),
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in-up">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BarChart2 size={18} className="text-accent-blue" /> Relatórios
        </h2>
        <p className="text-sm text-foreground/45">Panorama de {curMonth.month} e dos últimos 6 meses</p>
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

      <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-fade-in-up [animation-delay:40ms]">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === 'shared' ? '/relatorios' : `/relatorios?view=${t.id}`}
            className={cn(
              'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              view === t.id
                ? 'border-accent-emerald/40 bg-accent-emerald/15 text-accent-emerald'
                : 'border-border text-foreground/50 hover:text-foreground'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {view === 'shared' ? (
        <>
          <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up [animation-delay:80ms]">
            {statCards.map((s) => {
              const Icon = s.invert ? ArrowDown : ArrowUp
              const good = s.invert ? (s.pct ?? 0) <= 0 : (s.pct ?? 0) >= 0
              const toneText =
                s.tone === 'emerald' ? 'text-accent-emerald' : s.tone === 'purple' ? 'text-accent-purple' : 'text-accent-blue'
              const toneBg =
                s.tone === 'emerald' ? 'bg-accent-emerald/15 text-accent-emerald' : s.tone === 'purple' ? 'bg-accent-purple/15 text-accent-purple' : 'bg-accent-blue/15 text-accent-blue'
              return (
                <Card key={s.label} className="flex flex-col justify-between p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase leading-tight text-foreground/45">{s.label}</span>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md ${toneBg}`}>
                      <Icon size={12} />
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-bold tracking-tight ${toneText}`}>{fmtCurrency(s.value)}</p>
                    {s.pct != null && (
                      <span className={`mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold ${good ? 'text-accent-emerald' : 'text-accent-red'}`}>
                        {s.pct >= 0 ? '+' : ''}
                        {s.pct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="animate-fade-in-up [animation-delay:100ms]">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Fluxo de Caixa</h2>
                <p className="text-[11px] text-foreground/40">Entradas x saídas acumuladas em {curMonth.month}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-accent-emerald">
                  <span className="h-2 w-2 rounded-full bg-accent-emerald" /> Entradas
                </span>
                <span className="flex items-center gap-1.5 text-accent-purple">
                  <span className="h-2 w-2 rounded-full bg-accent-purple" /> Saídas
                </span>
              </div>
            </div>
            <CashFlowChart data={sharedCashFlow} />
          </Card>

          <Card className="animate-fade-in-up [animation-delay:120ms]">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Divisão de Despesas</h2>
              <p className="text-[11px] text-foreground/40">Distribuição por categoria · Este mês</p>
            </div>
            {sharedCategoryData.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <CategoryPieChart data={sharedCategoryData} total={sharedTotalThisMonth} size="compact" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {sharedCategoryData.map((c, i) => {
                    const pct = sharedTotalThisMonth > 0 ? Math.round((c.value / sharedTotalThisMonth) * 100) : 0
                    return (
                      <div key={c.key} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-foreground/70">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="truncate">
                            {c.emoji} {c.name}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-foreground/40">Sem despesas confirmadas este mês ainda.</p>
            )}
          </Card>

          <Card className="animate-fade-in-up [animation-delay:140ms]">
            <h2 className="mb-3 text-sm font-semibold">Receitas vs Despesas</h2>
            <p className="mb-2 text-[11px] text-foreground/40">Últimos 6 meses</p>
            <MonthlyBarChart data={months} />
          </Card>

          <div className="animate-fade-in-up [animation-delay:160ms]">
            <BudgetAllocationCard items={sharedBudgetItems} monthlyIncome={curMonth.renda} />
          </div>
        </>
      ) : personalView && selectedMember ? (
        <>
          <Card className="animate-fade-in-up [animation-delay:80ms]">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                Total gasto em {curMonth.month}
              </p>
              {personalView.pendingCount > 0 && (
                <Link
                  href="/auditor"
                  className="flex items-center gap-1 rounded-full border border-accent-orange/30 bg-accent-orange/10 px-2.5 py-1 text-[11px] font-medium text-accent-orange"
                >
                  <ShieldAlert size={12} />
                  {personalView.pendingCount} furo{personalView.pendingCount > 1 ? 's' : ''} de caixa
                </Link>
              )}
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold tracking-tight">{fmtCurrency(personalView.spentThisMonth)}</p>
              {personalView.pct != null && (
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
                    personalView.pct <= 0 ? 'bg-accent-emerald/15 text-accent-emerald' : 'bg-accent-red/15 text-accent-red'
                  )}
                >
                  {personalView.pct <= 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                  {Math.abs(personalView.pct).toFixed(1)}% vs mês ant.
                </span>
              )}
            </div>
            <p className="mt-3 border-t border-border pt-3 text-xs text-foreground/40">
              Média diária <span className="font-mono font-medium text-foreground/70">{fmtCurrency(personalView.avgPerDay)}</span> / dia
            </p>
          </Card>

          <Card className="animate-fade-in-up [animation-delay:100ms]">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Fluxo de Caixa</h2>
                <p className="text-[11px] text-foreground/40">Entradas x saídas de {selectedMember.name?.split(' ')[0]} em {curMonth.month}</p>
              </div>
            </div>
            <CashFlowChart data={personalView.cashFlow} />
          </Card>

          <PersonCategoryCard
            key={selectedMember.id}
            person={{
              id: selectedMember.id,
              name: selectedMember.name || 'Sem nome',
              avatarUrl: getAvatarUrl(selectedMember.avatar_path),
              data: personalView.data,
              total: personalView.total,
              expenses: personalView.expensesList,
              pendingCount: personalView.pendingCount,
            }}
            categories={categories}
          />

          <BudgetAllocationCard items={personalView.budgetItems} monthlyIncome={curMonth.renda} />
        </>
      ) : (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Users2 size={20} className="text-foreground/30" />
          <p className="text-sm text-foreground/40">Convide seu parceiro pra ver a visão pessoal dele aqui.</p>
        </Card>
      )}
    </div>
  )
}
