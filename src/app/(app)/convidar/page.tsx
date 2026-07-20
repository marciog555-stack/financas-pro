'use client'

import { useState } from 'react'
import { Check, Copy, RefreshCw, UserPlus, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { Button, Card, Input, Label } from '@/components/ui'

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={value} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
      <Button type="button" variant="secondary" size="sm" onClick={copy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  )
}

export default function ConvidarPage() {
  const { household, members } = useHousehold()
  const [inviteCode, setInviteCode] = useState(household.invite_code)
  const [regenerating, setRegenerating] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteLink = `${origin}/onboarding?invite=${inviteCode}`
  const referralLink = `${origin}/signup`

  async function handleRegenerate() {
    if (!confirm('Isso invalida o link de convite atual. Continuar?')) return
    setRegenerating(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('regenerate_invite_code', {
      p_household_id: household.id,
    })
    setRegenerating(false)
    if (!error && data) setInviteCode(data)
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={16} className="text-emerald-500" /> Convidar para {household.name}
        </h2>
        <p className="mb-3 text-sm text-foreground/50">
          Quem abrir esse link e criar uma conta passa a ver e editar os mesmos dados que você — renda,
          despesas, benefícios, empréstimos e metas.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Link de convite</Label>
            <CopyField value={inviteLink} />
          </div>
          <div>
            <Label>Ou código</Label>
            <CopyField value={inviteCode} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="w-fit"
          >
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
            Gerar novo código
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Share2 size={16} className="text-blue-500" /> Indicar o app
        </h2>
        <p className="mb-3 text-sm text-foreground/50">
          Quer só recomendar o Finanças Pro pra alguém? Esse link cria uma conta independente — a pessoa
          não vê os seus dados, só começa a própria casa financeira dela.
        </p>
        <Label>Link para compartilhar</Label>
        <CopyField value={referralLink} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Quem já está em {household.name}</h2>
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/10">
          {members.map((m) => (
            <div key={m.id} className="py-2 text-sm">
              {m.name.trim() || 'Sem nome'}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
