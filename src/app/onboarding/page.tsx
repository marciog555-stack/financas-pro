'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Label } from '@/components/ui'
import { cn } from '@/lib/cn'
import { Home, Users } from 'lucide-react'

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteFromLink = searchParams.get('invite') ?? ''

  const [mode, setMode] = useState<'create' | 'join'>(inviteFromLink ? 'join' : 'create')
  const [name, setName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState(inviteFromLink)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { error } =
      mode === 'create'
        ? await supabase.rpc('create_household', {
            p_household_name: householdName || `Casa de ${name}`,
            p_display_name: name,
          })
        : await supabase.rpc('join_household', {
            p_invite_code: inviteCode,
            p_display_name: name,
          })

    setLoading(false)
    if (error) {
      setError(mode === 'join' ? 'Código de convite inválido.' : error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold">Vamos começar</h1>
        <p className="mt-1 text-sm text-foreground/50">
          Crie sua casa financeira ou entre em uma existente com um convite.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors',
              mode === 'create'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5'
            )}
          >
            <Home size={18} />
            Criar nova casa
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors',
              mode === 'join'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5'
            )}
          >
            <Users size={18} />
            Entrar com convite
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <div>
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {mode === 'create' ? (
            <div>
              <Label htmlFor="householdName">Nome da casa (opcional)</Label>
              <Input
                id="householdName"
                placeholder={name ? `Casa de ${name}` : 'Ex: Casa do Marcio e Michelle'}
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="inviteCode">Código de convite</Label>
              <Input
                id="inviteCode"
                required
                placeholder="Ex: A1B2C3D4"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              />
              <p className="mt-1 text-xs text-foreground/40">
                Peça o link ou código de convite para quem já tem a conta.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Salvando…' : 'Concluir'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}
