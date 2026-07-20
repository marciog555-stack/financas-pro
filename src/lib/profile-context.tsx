'use client'

import { createContext, useContext } from 'react'
import type { Tables } from '@/lib/database.types'

export type Profile = Tables<'profiles'>

const ProfileContext = createContext<Profile | null>(null)

export function ProfileProvider({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const profile = useContext(ProfileContext)
  if (!profile) throw new Error('useProfile must be used within a ProfileProvider')
  return profile
}

export function ownerLabel(profile: Profile, owner: string | null) {
  if (owner === 'partner') return profile.partner_name || 'Parceiro(a)'
  if (owner === 'shared') return 'Compartilhado'
  return profile.name || 'Eu'
}
