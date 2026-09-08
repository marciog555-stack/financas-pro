export function resolveMonth(monthParam?: string) {
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth()
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    year = y
    month = m - 1
  }

  const monthDate = new Date(year, month, 1)
  const monthStart = monthDate.toISOString().slice(0, 10)
  const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysLeftInMonth = isCurrentMonth ? daysInMonth - now.getDate() + 1 : null

  const prevMonthDate = new Date(year, month - 1, 1)
  const nextMonthDate = new Date(year, month + 1, 1)
  const prevParam = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
  const nextParam = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`

  const monthLabelFull = capitalize(monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
  const monthNameOnly = capitalize(monthDate.toLocaleDateString('pt-BR', { month: 'long' }))

  return {
    year,
    month,
    monthStart,
    monthEnd,
    isCurrentMonth,
    daysLeftInMonth,
    prevParam,
    nextParam,
    monthLabelFull,
    monthNameOnly,
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
