'use client'

import { Select } from '@/components/ui'
import { useProfile } from '@/lib/profile-context'

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
  const profile = useProfile()

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} {...props}>
      <option value="me">{profile.name || 'Eu'}</option>
      {profile.mode === 'couple' && (
        <option value="partner">{profile.partner_name || 'Parceiro(a)'}</option>
      )}
      {includeShared && <option value="shared">Compartilhado</option>}
    </Select>
  )
}
