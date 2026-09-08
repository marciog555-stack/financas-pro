'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { Input, Button } from '@/components/ui'
import { cn } from '@/lib/cn'

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function CategoryGrid({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { household, categories } = useHousehold()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('📦')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    const key = slugify(label)
    if (!key) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: insertError } = await supabase.from('expense_categories').insert({
      household_id: household.id,
      key,
      label: label.trim(),
      emoji: emoji.trim() || '📦',
      sort_order: categories.length,
    })
    setSaving(false)
    if (insertError) {
      setError(
        insertError.code === '23505' ? 'Já existe uma categoria com esse nome.' : 'Não foi possível criar a categoria.'
      )
      return
    }
    setLabel('')
    setEmoji('📦')
    setAdding(false)
    onChange(key)
    router.refresh()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const active = value === c.key
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
              active
                ? 'border-accent-emerald/60 bg-accent-emerald/10 text-accent-emerald'
                : 'border-border text-foreground/60 hover:bg-surface-2'
            )}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        )
      })}

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-2 text-xs font-medium text-foreground/40 hover:bg-surface-2"
        >
          <Plus size={14} /> Nova
        </button>
      ) : (
        <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-surface-2/40 p-2">
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-12 px-2 text-center"
            maxLength={4}
          />
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nome da categoria"
            className="flex-1"
            autoFocus
          />
          <Button type="button" size="sm" onClick={handleAdd} disabled={saving || !label.trim()}>
            <Check size={14} />
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)} disabled={saving}>
            <X size={14} />
          </Button>
        </div>
      )}
      {error && <p className="w-full text-xs text-accent-red">{error}</p>}
    </div>
  )
}
