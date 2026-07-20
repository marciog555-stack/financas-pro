'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Label } from '@/components/ui'
import { PasswordInput } from '@/components/password-input'
import { KeyRound, CheckCircle2 } from 'lucide-react'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const readyRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    function markReady() {
      readyRef.current = true
      setReady(true)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) markReady()
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady()
    })

    const timeout = setTimeout(() => {
      if (!readyRef.current) setInvalid(true)
    }, 2500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1800)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-fade-in-up text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-emerald/10 text-accent-emerald">
            <CheckCircle2 size={22} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Senha atualizada</h1>
          <p className="mt-2 text-sm text-foreground/45">Redirecionando para o app…</p>
        </Card>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-fade-in-up text-center">
          {invalid ? (
            <>
              <h1 className="text-lg font-semibold tracking-tight">Link inválido ou expirado</h1>
              <p className="mt-2 text-sm text-foreground/45">
                Peça um novo link de redefinição de senha.
              </p>
              <Link
                href="/esqueci-senha"
                className="mt-4 inline-block text-sm font-medium text-accent-emerald hover:underline"
              >
                Solicitar novo link
              </Link>
            </>
          ) : (
            <p className="text-sm text-foreground/45">Verificando link…</p>
          )}
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
          <h1 className="text-lg font-semibold tracking-tight">Criar nova senha</h1>
          <p className="text-center text-sm text-foreground/45">Escolha uma nova senha para sua conta.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="password">Nova senha</Label>
            <PasswordInput
              id="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordInput
              id="confirmPassword"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-accent-red">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
