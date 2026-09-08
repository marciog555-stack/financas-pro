'use client'

import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import { cn } from '@/lib/cn'

export function CategoryGrid({
  value,
  onChange,
}: {
  value: ExpenseCategory
  onChange: (value: ExpenseCategory) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, emoji }]) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key as ExpenseCategory)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
              active
                ? 'border-accent-emerald/60 bg-accent-emerald/10 text-accent-emerald'
                : 'border-border text-foreground/60 hover:bg-surface-2'
            )}
          >
            <span>{emoji}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
