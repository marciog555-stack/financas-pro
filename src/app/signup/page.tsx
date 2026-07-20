'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Label } from '@/components/ui'
import { Wallet } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
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
      router.push('/onboarding')
      router.refresh()
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <h1 className="text-lg font-semibold">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-foreground/50">
            Enviamos um link de confirmação para {email}. Depois de confirmar, faça login.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline">
            Ir para o login
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Wallet size={20} />
          </div>
          <h1 className="text-lg font-semibold">Criar conta</h1>
          <p className="text-sm text-foreground/50">Comece a organizar suas finanças</p>
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
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-foreground/50">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  )
}
