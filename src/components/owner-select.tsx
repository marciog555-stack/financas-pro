'use client'

import { Select } from '@/components/ui'
import { useHousehold } from '@/lib/household-context'

export function OwnerSelect({
  value,
  onChange,
  includeShared = false,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  includeShared?: boolean
} & Omit<React.ComponentProps<typeof Select>, 'value' | 'onChange'>) {
  const { members } = useHousehold()

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} {...props}>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name.trim() || 'Sem nome'}
        </option>
      ))}
      {includeShared && <option value="">Compartilhado</option>}
    </Select>
  )
}
