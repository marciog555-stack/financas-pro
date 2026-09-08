import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MonthNav({
  label,
  prevParam,
  nextParam,
  basePath = '/',
}: {
  label: string
  prevParam: string
  nextParam: string
  basePath?: string
}) {
  return (
    <div className="flex items-center justify-between animate-fade-in-up">
      <Link
        href={`${basePath}?m=${prevParam}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 hover:bg-surface-2 hover:text-foreground"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} />
      </Link>
      <h1 className="text-base font-semibold">{label}</h1>
      <Link
        href={`${basePath}?m=${nextParam}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 hover:bg-surface-2 hover:text-foreground"
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} />
      </Link>
    </div>
  )
}
