import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, Badge } from '@/components/ui'
import { AnimatedNumber } from '@/components/animated-number'
import { ProgressBar } from '@/components/progress-bar'
import { Avatar } from '@/components/avatar'
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import { ownerLabel } from '@/lib/owner-label'
import { TrendingUp, TrendingDown, Wallet, Landmark, Target, CalendarClock, Users } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
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

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const householdId = profile.household_id

  const [
    { data: incomes },
    { data: expenses },
    { data: benefits },
    { data: loans },
    { data: goals },
    { data: upcomingExpenses },
    { data: members },
  ] = await Promise.all([
    supabase.from('incomes').select('*').eq('household_id', householdId).gte('date', monthStart).lte('date', monthEnd),
    supabase.from('expenses').select('*').eq('household_id', householdId).gte('due_date', monthStart).lte('due_date', monthEnd),
    supabase.from('benefit_cards').select('*').eq('household_id', householdId),
    supabase.from('loans').select('*').eq('household_id', householdId),
    supabase.from('goals').select('*').eq('household_id', householdId),
    supabase
      .from('expenses')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_paid', false)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase.from('profiles').select('*').eq('household_id', householdId).order('created_at'),
  ])

  const totalIncome = (incomes ?? []).reduce((s, i) => s + Number(i.amount), 0)
  const totalExpense = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const balance = totalIncome - totalExpense
  const totalBenefits = (benefits ?? []).reduce((s, b) => s + Number(b.balance), 0)
  const totalLoanDebt = (loans ?? []).reduce(
    (s, l) => s + Number(l.monthly_payment) * l.remaining_installments,
    0
  )

  const upcoming = upcomingExpenses ?? []

  const spendByOwner = new Map<string | null, number>()
  for (const e of expenses ?? []) {
    const key = e.owner_profile_id
    spendByOwner.set(key, (spendByOwner.get(key) ?? 0) + Number(e.amount))
  }
  const spendByPerson = Array.from(spendByOwner.entries())
    .map(([ownerId, amount]) => ({ name: ownerLabel(members ?? [], ownerId), amount }))
    .sort((a, b) => b.amount - a.amount)

  const positive = balance >= 0

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: saldo total */}
      <Card
        className={`animate-fade-in-up overflow-hidden border-0 bg-gradient-to-br p-6 text-white shadow-lg ${
          positive
            ? 'from-accent-blue/90 to-accent-emerald/80 shadow-accent-blue/20'
            : 'from-accent-red/85 to-accent-blue/70 shadow-accent-red/20'
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">Saldo do mês</p>
        <p className="mt-1.5 text-4xl font-semibold tracking-tight">
          <AnimatedNumber value={balance} />
        </p>
        <div className="mt-5 flex gap-6 border-t border-white/20 pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-white/80" />
            <div>
              <p className="text-[11px] text-white/60">Receitas</p>
              <p className="text-sm font-semibold">{fmtCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={15} className="text-white/80" />
            <div>
              <p className="text-[11px] text-white/60">Despesas</p>
              <p className="text-sm font-semibold">{fmtCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Dívidas e benefícios */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up [animation-delay:80ms]">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground/45">
            <Landmark size={14} className="text-accent-red" /> Dívidas
          </div>
          <p className="mt-1.5 font-mono text-lg font-semibold text-accent-red">{fmtCurrency(totalLoanDebt)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground/45">
            <Wallet size={14} className="text-accent-orange" /> Benefícios
          </div>
          <p className="mt-1.5 font-mono text-lg font-semibold text-accent-orange">{fmtCurrency(totalBenefits)}</p>
        </Card>
      </div>

      {spendByPerson.length > 0 && totalExpense > 0 && (
        <Card className="animate-fade-in-up [animation-delay:120ms]">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users size={15} className="text-foreground/40" /> Gastos por pessoa
          </h2>
          <div className="flex flex-col gap-3">
            {spendByPerson.map((p) => {
              const pct = Math.round((p.amount / totalExpense) * 100)
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <Avatar name={p.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate font-medium text-foreground/70">{p.name}</span>
                      <span className="font-mono text-foreground/40">{fmtCurrency(p.amount)}</span>
                    </div>
                    <ProgressBar value={pct} className="h-1.5" barClassName="bg-accent-blue" />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="animate-fade-in-up [animation-delay:160ms]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock size={15} className="text-foreground/40" /> Contas a vencer
            </h2>
            <Link href="/despesas" className="text-xs font-medium text-accent-emerald hover:underline">
              Ver todas
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/40">Tudo em dia por aqui 🎉</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {upcoming.map((e) => {
                const cat = EXPENSE_CATEGORIES[e.category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
                const overdue = Boolean(e.due_date && e.due_date < todayISO())
                return (
                  <div key={e.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg">
                      {cat.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-foreground/40">
                        {overdue ? 'Venceu' : 'Vence'} {fmtDate(e.due_date)}
                      </p>
                    </div>
                    <Badge tone={overdue ? 'danger' : 'warning'}>{fmtCurrency(Number(e.amount))}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="animate-fade-in-up [animation-delay:200ms]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Target size={15} className="text-accent-purple" /> Metas
            </h2>
            <Link href="/metas" className="text-xs font-medium text-accent-emerald hover:underline">
              Ver todas
            </Link>
          </div>
          {!goals || goals.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/40">Nenhuma meta criada ainda.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {goals.slice(0, 4).map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)
                )
                return (
                  <div key={goal.id}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground/70">{goal.name}</span>
                      <span className="font-mono text-foreground/40">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} barClassName="bg-accent-purple" />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
