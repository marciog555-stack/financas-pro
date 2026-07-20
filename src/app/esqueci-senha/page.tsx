'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Label } from '@/components/ui'
import { translateAuthError } from '@/lib/auth-errors'
import { KeyRound } from 'lucide-react'

function EsqueciSenhaForm() {
  const searchParams = useSearchParams()
  const invite = searchParams.get('invite')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/redefinir-senha`,
    })
    setLoading(false)
    if (error) {
      setError(translateAuthError(error.message))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-fade-in-up text-center">
          <h1 className="text-lg font-semibold tracking-tight">Verifique seu e-mail</h1>
          <p className="mt-2 text-sm text-foreground/45">
            Se {email} tiver uma conta, enviamos um link para redefinir a senha.
          </p>
          <Link
            href={invite ? `/login?invite=${invite}` : '/login'}
            className="mt-4 inline-block text-sm font-medium text-accent-emerald hover:underline"
          >
            Voltar para o login
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
            <KeyRound size={20} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Redefinir senha</h1>
          <p className="text-center text-sm text-foreground/45">
            Informe seu e-mail e enviaremos um link para você criar uma nova senha.
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
          {error && <p className="text-xs text-accent-red">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Enviando…' : 'Enviar link de redefinição'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-foreground/45">
          Lembrou a senha?{' '}
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

export default function EsqueciSenhaPage() {
  return (
    <Suspense>
      <EsqueciSenhaForm />
    </Suspense>
  )
}
