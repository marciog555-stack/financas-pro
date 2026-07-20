export const fmtCurrency = (n: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

export const fmtMonthYear = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const todayISO = () => new Date().toISOString().slice(0, 10)
