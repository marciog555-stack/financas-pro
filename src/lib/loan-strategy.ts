import type { Tables } from '@/lib/database.types'

type Loan = Tables<'loans'>

export function remainingBalance(loan: Loan) {
  return Number(loan.monthly_payment) * loan.remaining_installments
}

export function loanPayoffRecommendation(loans: Loan[]) {
  const active = loans.filter((l) => l.remaining_installments > 0)
  if (active.length === 0) return null

  const byInterest = [...active].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate))
  const byBalance = [...active].sort((a, b) => remainingBalance(a) - remainingBalance(b))

  return {
    avalanche: byInterest[0],
    snowball: byBalance[0],
    sameLoan: byInterest[0].id === byBalance[0].id,
  }
}
