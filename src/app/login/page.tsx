'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Label } from '@/components/ui'
import { PasswordInput } from '@/components/password-input'
import { Wallet } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invite = searchParams.get('invite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message)
      return
    }
    router.push(invite ? `/onboarding?invite=${invite}` : '/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-emerald text-white shadow-sm shadow-accent-emerald/30">
            <Wallet size={20} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Finanças Pro</h1>
          <p className="text-sm text-foreground/45">
            {invite ? 'Entre para aceitar o convite' : 'Entre na sua conta'}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="mb-1.5">Senha</Label>
              <Link
                href={invite ? `/esqueci-senha?invite=${invite}` : '/esqueci-senha'}
                className="mb-1.5 text-xs font-medium text-accent-emerald hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-accent-red">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-foreground/45">
          Não tem conta?{' '}
          <Link
            href={invite ? `/signup?invite=${invite}` : '/signup'}
            className="font-medium text-accent-emerald hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
