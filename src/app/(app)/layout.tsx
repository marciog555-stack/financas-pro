import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileProvider } from '@/lib/profile-context'
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

  if (!profile) redirect('/onboarding')

  return (
    <ProfileProvider profile={profile}>
      <Shell email={user.email ?? ''}>{children}</Shell>
    </ProfileProvider>
  )
}
