'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Label } from '@/components/ui'
import { cn } from '@/lib/cn'
import { Users, User } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'single' | 'couple'>('couple')
  const [partnerName, setPartnerName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada, faça login novamente.')
      setLoading(false)
      return
    }
    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      name,
      mode,
      partner_name: mode === 'couple' ? partnerName : null,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
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
          Conte um pouco sobre como você quer organizar suas finanças.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <div>
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Como você vai usar o app?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors',
                  mode === 'single'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5'
                )}
              >
                <User size={18} />
                Individual
              </button>
              <button
                type="button"
                onClick={() => setMode('couple')}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors',
                  mode === 'couple'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5'
                )}
              >
                <Users size={18} />
                Casal
              </button>
            </div>
          </div>

          {mode === 'couple' && (
            <div>
              <Label htmlFor="partnerName">Nome do parceiro(a)</Label>
              <Input
                id="partnerName"
                required
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
              />
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
