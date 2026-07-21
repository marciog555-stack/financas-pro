import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>

export function ownerLabel(members: Profile[], ownerProfileId: string | null) {
  if (!ownerProfileId) return 'Compartilhado'
  return members.find((m) => m.id === ownerProfileId)?.name.trim() || 'Compartilhado'
}
