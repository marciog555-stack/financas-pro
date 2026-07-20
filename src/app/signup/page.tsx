'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Label } from '@/components/ui'
import { Wallet } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invite = searchParams.get('invite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) {
      router.push(invite ? `/onboarding?invite=${invite}` : '/onboarding')
      router.refresh()
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-fade-in-up text-center">
          <h1 className="text-lg font-semibold tracking-tight">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-foreground/45">
            Enviamos um link de confirmação para {email}. Depois de confirmar, faça login.
          </p>
          <Link
            href={invite ? `/login?invite=${invite}` : '/login'}
            className="mt-4 inline-block text-sm font-medium text-accent-emerald hover:underline"
          >
            Ir para o login
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-emerald text-white shadow-sm shadow-accent-emerald/30">
            <Wallet size={20} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Criar conta</h1>
          <p className="text-sm text-foreground/45">
            {invite ? 'Você foi convidado para uma casa financeira' : 'Comece a organizar suas finanças'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-accent-red">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-foreground/45">
          Já tem conta?{' '}
          <Link
            href={invite ? `/login?invite=${invite}` : '/login'}
            className="font-medium text-accent-emerald hover:underline"
          >
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
