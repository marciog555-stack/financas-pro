'use client'

import { createContext, useContext } from 'react'
import type { Tables } from '@/lib/database.types'

export type Profile = Tables<'profiles'>
export type Household = Tables<'households'>

type HouseholdContextValue = {
  profile: Profile
  household: Household
  members: Profile[]
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

export function HouseholdProvider({
  value,
  children,
}: {
  value: HouseholdContextValue
  children: React.ReactNode
}) {
  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used within a HouseholdProvider')
  return ctx
}

export function useProfile() {
  return useHousehold().profile
}

export { ownerLabel } from '@/lib/owner-label'
