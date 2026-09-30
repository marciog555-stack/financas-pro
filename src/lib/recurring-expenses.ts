import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, TablesInsert } from '@/lib/database.types'

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Garante que toda despesa marcada como "fixa" tenha uma ocorrência no mês
 * [targetMonthStart, targetMonthEnd]. Se a última ocorrência de uma despesa
 * fixa for de um mês anterior, cria uma cópia (mesmo valor/categoria/dono)
 * com o vencimento no mesmo dia do mês alvo.
 */
export async function ensureRecurringExpenses(
  supabase: SupabaseClient<Database>,
  householdId: string,
  targetMonthStart: string
) {
  const { data: recurring } = await supabase
    .from('expenses')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_recurring', true)
    .order('due_date', { ascending: false })

  if (!recurring || recurring.length === 0) return

  const latestByName = new Map<string, (typeof recurring)[number]>()
  for (const e of recurring) {
    const key = e.name.trim().toLowerCase()
    if (!latestByName.has(key)) latestByName.set(key, e)
  }

  const targetStart = new Date(targetMonthStart + 'T00:00:00')

  const toInsert: TablesInsert<'expenses'>[] = []
  for (const latest of Array.from(latestByName.values())) {
    if (!latest.due_date) continue
    const latestDue = new Date(latest.due_date + 'T00:00:00')
    if (latestDue >= targetStart) continue // já existe nesse mês ou é mais recente que o mês alvo

    const day = Math.min(latestDue.getDate(), lastDayOfMonth(targetStart.getFullYear(), targetStart.getMonth()))
    const newDueDate = new Date(targetStart.getFullYear(), targetStart.getMonth(), day)

    toInsert.push({
      household_id: householdId,
      name: latest.name,
      amount: latest.amount,
      category: latest.category,
      due_date: newDueDate.toISOString().slice(0, 10),
      owner_profile_id: latest.owner_profile_id,
      is_paid: false,
      is_recurring: true,
    })
  }

  if (toInsert.length > 0) {
    await supabase.from('expenses').insert(toInsert)
  }
}
