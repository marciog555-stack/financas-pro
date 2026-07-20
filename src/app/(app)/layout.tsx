import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HouseholdProvider } from '@/lib/household-context'
import { Shell } from '@/components/shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile || !profile.household_id) redirect('/onboarding')

  const [{ data: household }, { data: members }] = await Promise.all([
    supabase.from('households').select('*').eq('id', profile.household_id).single(),
    supabase.from('profiles').select('*').eq('household_id', profile.household_id).order('created_at'),
  ])

  if (!household) redirect('/onboarding')

  return (
    <HouseholdProvider value={{ profile, household, members: members ?? [profile] }}>
      <Shell email={user.email ?? ''}>{children}</Shell>
    </HouseholdProvider>
  )
}
