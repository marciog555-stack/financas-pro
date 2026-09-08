'use client'

import { Users } from 'lucide-react'
import { Avatar } from '@/components/avatar'
import { getAvatarUrl } from '@/lib/avatars'
import { useHousehold } from '@/lib/household-context'
import { cn } from '@/lib/cn'

export function OwnerChips({
  value,
  onChange,
  includeShared = false,
}: {
  value: string
  onChange: (value: string) => void
  includeShared?: boolean
}) {
  const { members } = useHousehold()

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {members.map((m) => {
        const active = value === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={cn(
              'flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-medium transition-colors',
              active
                ? 'border-accent-emerald/60 bg-accent-emerald/10 text-accent-emerald'
                : 'border-border text-foreground/60 hover:bg-surface-2'
            )}
          >
            <Avatar name={m.name || '?'} src={getAvatarUrl(m.avatar_path)} size={36} />
            <span className="max-w-[64px] truncate">{(m.name || 'Sem nome').split(' ')[0]}</span>
          </button>
        )
      })}
      {includeShared && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-medium transition-colors',
            value === ''
              ? 'border-accent-blue/60 bg-accent-blue/10 text-accent-blue'
              : 'border-border text-foreground/60 hover:bg-surface-2'
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue">
            <Users size={16} />
          </span>
          Compartilhado
        </button>
      )}
    </div>
  )
}
