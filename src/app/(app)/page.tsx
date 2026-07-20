import { createClient } from '@/lib/supabase/server'
import { Card, Badge } from '@/components/ui'
import { fmtCurrency, fmtDate } from '@/lib/format'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import { TrendingUp, TrendingDown, Wallet, Landmark } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const householdId = profile!.household_id!

  const [{ data: incomes }, { data: expenses }, { data: benefits }, { data: loans }, { data: goals }] =
    await Promise.all([
      supabase.from('incomes').select('*').eq('household_id', householdId).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('expenses').select('*').eq('household_id', householdId).gte('due_date', monthStart).lte('due_date', monthEnd),
      supabase.from('benefit_cards').select('*').eq('household_id', householdId),
      supabase.from('loans').select('*').eq('household_id', householdId),
      supabase.from('goals').select('*').eq('household_id', householdId),
    ])

  const totalIncome = (incomes ?? []).reduce((s, i) => s + Number(i.amount), 0)
  const totalExpense = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const balance = totalIncome - totalExpense
  const totalBenefits = (benefits ?? []).reduce((s, b) => s + Number(b.balance), 0)
  const totalLoanDebt = (loans ?? []).reduce(
    (s, l) => s + Number(l.monthly_payment) * l.remaining_installments,
    0
  )

  const upcoming = (expenses ?? [])
    .filter((e) => !e.is_paid)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <TrendingUp size={14} className="text-emerald-500" /> Renda do mês
          </div>
          <p className="mt-1 font-mono text-xl font-semibold text-emerald-600">{fmtCurrency(totalIncome)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <TrendingDown size={14} className="text-red-500" /> Despesas do mês
          </div>
          <p className="mt-1 font-mono text-xl font-semibold text-red-500">{fmtCurrency(totalExpense)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <Wallet size={14} className="text-blue-500" /> Saldo do mês
          </div>
          <p className={`mt-1 font-mono text-xl font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {fmtCurrency(balance)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <Landmark size={14} className="text-purple-500" /> Dívida em aberto
          </div>
          <p className="mt-1 font-mono text-xl font-semibold">{fmtCurrency(totalLoanDebt)}</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Contas a vencer</h2>
            <Link href="/despesas" className="text-xs font-medium text-emerald-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/40">Tudo em dia por aqui 🎉</p>
          ) : (
            <div className="flex flex-col divide-y divide-black/5 dark:divide-white/10">
              {upcoming.map((e) => {
                const cat = EXPENSE_CATEGORIES[e.category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
                return (
                  <div key={e.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-lg">{cat.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-foreground/40">Vence {fmtDate(e.due_date)}</p>
                    </div>
                    <Badge tone="warning">{fmtCurrency(Number(e.amount))}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Metas</h2>
            <Link href="/metas" className="text-xs font-medium text-emerald-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {!goals || goals.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/40">Nenhuma meta criada ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {goals.slice(0, 4).map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)
                )
                return (
                  <div key={goal.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground/70">{goal.name}</span>
                      <span className="text-foreground/40">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: goal.color ?? '#10B981' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {totalBenefits > 0 && (
        <Card>
          <p className="text-xs text-foreground/50">Saldo total em benefícios (VR/VA/VT)</p>
          <p className="mt-1 font-mono text-lg font-semibold">{fmtCurrency(totalBenefits)}</p>
        </Card>
      )}
    </div>
  )
}
