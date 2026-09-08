'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Check,
  Copy,
  Pencil,
  RefreshCw,
  UserPlus,
  Share2,
  LogOut,
  X,
  Settings,
  Scale,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { Avatar } from '@/components/avatar'
import { getAvatarUrl, uploadHouseholdPhoto, uploadProfileAvatar } from '@/lib/avatars'
import { Button, Card, Input, Label } from '@/components/ui'
import { fmtCurrency } from '@/lib/format'

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

export default function ConfiguracoesPage() {
  const { profile, household, members } = useHousehold()
  const router = useRouter()
  const partner = members.find((m) => m.id !== profile.id) ?? null
  const [inviteCode, setInviteCode] = useState(household.invite_code)
  const [regenerating, setRegenerating] = useState(false)

  const [splitValue, setSplitValue] = useState(Math.round(profile.split_percentage))
  const [savingSplit, setSavingSplit] = useState(false)

  const [editingLimit, setEditingLimit] = useState(false)
  const [limitValue, setLimitValue] = useState(
    household.monthly_budget != null ? String(household.monthly_budget) : ''
  )
  const [savingLimit, setSavingLimit] = useState(false)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(profile.name)
  const [householdName, setHouseholdName] = useState(household.name)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [householdFile, setHouseholdFile] = useState<File | null>(null)
  const profileFileInputRef = useRef<HTMLInputElement>(null)
  const householdFileInputRef = useRef<HTMLInputElement>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteLink = `${origin}/onboarding?invite=${inviteCode}`
  const referralLink = `${origin}/signup`

  const profileAvatarUrl = profileFile
    ? URL.createObjectURL(profileFile)
    : getAvatarUrl(profile.avatar_path)
  const householdPhotoUrl = householdFile
    ? URL.createObjectURL(householdFile)
    : getAvatarUrl(household.photo_path)

  function startEditing() {
    setName(profile.name)
    setHouseholdName(household.name)
    setProfileFile(null)
    setHouseholdFile(null)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setProfileFile(null)
    setHouseholdFile(null)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    try {
      let avatarPath = profile.avatar_path
      if (profileFile) {
        avatarPath = await uploadProfileAvatar(supabase, profile.user_id!, profileFile)
      }
      let photoPath = household.photo_path
      if (householdFile) {
        photoPath = await uploadHouseholdPhoto(supabase, household.id, householdFile)
      }

      if (name.trim() && name !== profile.name || avatarPath !== profile.avatar_path) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: name.trim() || profile.name, avatar_path: avatarPath })
          .eq('id', profile.id)
        if (error) throw error
      }

      if (householdName.trim() && householdName !== household.name || photoPath !== household.photo_path) {
        const { error } = await supabase
          .from('households')
          .update({ name: householdName.trim() || household.name, photo_path: photoPath })
          .eq('id', household.id)
        if (error) throw error
      }

      setEditing(false)
      setProfileFile(null)
      setHouseholdFile(null)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível salvar as alterações.')
    } finally {
      setSaving(false)
    }
  }

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

  async function handleSaveSplit() {
    setSavingSplit(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('set_split_percentage', { p_my_percentage: splitValue })
    setSavingSplit(false)
    if (error) {
      alert('Não foi possível salvar a divisão.')
      return
    }
    router.refresh()
  }

  async function handleSaveLimit() {
    const parsed = limitValue.trim() === '' ? null : Number(limitValue.replace(',', '.'))
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) return
    setSavingLimit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('households')
      .update({ monthly_budget: parsed })
      .eq('id', household.id)
    setSavingLimit(false)
    if (error) {
      alert('Não foi possível salvar o limite.')
      return
    }
    setEditingLimit(false)
    router.refresh()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 animate-fade-in-up">
        <Settings size={18} className="text-foreground/60" />
        <h2 className="text-lg font-semibold tracking-tight">Configurações</h2>
      </div>

      <Card className="animate-fade-in-up">
        {!editing ? (
          <div className="flex items-center gap-3">
            <Avatar name={profile.name || '?'} src={profileAvatarUrl} size={56} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{profile.name || 'Sem nome'}</p>
              <p className="truncate text-sm text-foreground/45">{household.name}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={startEditing}>
              <Pencil size={14} /> Editar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
                className="group relative shrink-0"
              >
                <Avatar name={name || '?'} src={profileAvatarUrl} size={56} />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-emerald text-white shadow-sm">
                  <Camera size={11} />
                </span>
              </button>
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
              />
              <div className="min-w-0 flex-1">
                <Label htmlFor="profileName">Seu nome</Label>
                <Input id="profileName" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => householdFileInputRef.current?.click()}
                className="group relative shrink-0"
              >
                <Avatar name={householdName || '?'} src={householdPhotoUrl} size={56} />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue text-white shadow-sm">
                  <Camera size={11} />
                </span>
              </button>
              <input
                ref={householdFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setHouseholdFile(e.target.files?.[0] ?? null)}
              />
              <div className="min-w-0 flex-1">
                <Label htmlFor="householdName">Nome da casa</Label>
                <Input
                  id="householdName"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-foreground/40">
              Toque na foto pra trocar — a de cima é a sua, a de baixo é a do casal/casa.
            </p>

            <div className="flex gap-2">
              <Button type="button" onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Salvando…' : (
                  <>
                    <Check size={14} /> Salvar
                  </>
                )}
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEditing} disabled={saving}>
                <X size={14} /> Cancelar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {partner && (
        <Card className="animate-fade-in-up [animation-delay:40ms]">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Scale size={16} className="text-accent-purple" /> Divisão dos gastos
          </h2>
          <div className="flex items-center gap-3">
            <Avatar name={profile.name || '?'} src={getAvatarUrl(profile.avatar_path)} size={32} />
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={splitValue}
              onChange={(e) => setSplitValue(Number(e.target.value))}
              className="h-1.5 flex-1 accent-accent-purple"
            />
            <Avatar name={partner.name || '?'} src={getAvatarUrl(partner.avatar_path)} size={32} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-foreground/50">
            <span>{splitValue}%</span>
            <span>{100 - splitValue}%</span>
          </div>
          {splitValue !== Math.round(profile.split_percentage) && (
            <Button type="button" size="sm" onClick={handleSaveSplit} disabled={savingSplit} className="mt-3">
              {savingSplit ? 'Salvando…' : 'Salvar divisão'}
            </Button>
          )}
        </Card>
      )}

      <Card className="animate-fade-in-up [animation-delay:60ms]">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Wallet size={16} className="text-accent-emerald" /> Limite de gastos mensal
        </h2>
        {editingLimit ? (
          <div className="flex items-center gap-2">
            <Input
              inputMode="decimal"
              placeholder="Ex: 1000"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="button" size="sm" onClick={handleSaveLimit} disabled={savingLimit}>
              {savingLimit ? '...' : 'Salvar'}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditingLimit(false)} disabled={savingLimit}>
              Cancelar
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setLimitValue(household.monthly_budget != null ? String(household.monthly_budget) : '')
              setEditingLimit(true)
            }}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm text-foreground/60">
              {household.monthly_budget != null ? fmtCurrency(household.monthly_budget) : 'Sem limite definido'}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-accent-emerald">
              <Pencil size={12} /> Editar
            </span>
          </button>
        )}
      </Card>

      <Card className="animate-fade-in-up [animation-delay:80ms]">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={16} className="text-accent-emerald" /> Convidar para {household.name}
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

      <Card className="animate-fade-in-up [animation-delay:120ms]">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Share2 size={16} className="text-accent-blue" /> Indicar o app
        </h2>
        <p className="mb-3 text-sm text-foreground/50">
          Quer só recomendar o Finanças Pro pra alguém? Esse link cria uma conta independente — a pessoa
          não vê os seus dados, só começa a própria casa financeira dela.
        </p>
        <Label>Link para compartilhar</Label>
        <CopyField value={referralLink} />
      </Card>

      <Card className="animate-fade-in-up [animation-delay:160ms]">
        <h2 className="mb-3 text-sm font-semibold">Quem já está em {household.name}</h2>
        <div className="flex flex-col divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="py-2 text-sm">
              {m.name.trim() || 'Sem nome'}
            </div>
          ))}
        </div>
      </Card>

      <Button type="button" variant="secondary" onClick={handleLogout} className="animate-fade-in-up [animation-delay:200ms]">
        <LogOut size={16} /> Sair da conta
      </Button>
    </div>
  )
}
