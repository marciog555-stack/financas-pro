'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Wallet,
  Landmark,
  Target,
  BarChart2,
  UserPlus,
  LogOut,
  Plus,
  Home,
  Grid2x2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { cn } from '@/lib/cn'
import { BottomSheet } from '@/components/bottom-sheet'
import { QuickAddSheet } from '@/components/quick-add-sheet'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/renda', label: 'Renda', icon: TrendingUp },
  { href: '/despesas', label: 'Despesas', icon: CreditCard },
  { href: '/beneficios', label: 'Benefícios', icon: Wallet },
  { href: '/emprestimos', label: 'Empréstimos', icon: Landmark },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/convidar', label: 'Convidar', icon: UserPlus },
]

const MOVIMENTACOES = [
  { href: '/renda', label: 'Renda', icon: TrendingUp, tone: 'text-accent-emerald bg-accent-emerald/10' },
  { href: '/despesas', label: 'Despesas', icon: CreditCard, tone: 'text-accent-red bg-accent-red/10' },
  { href: '/beneficios', label: 'Benefícios', icon: Wallet, tone: 'text-accent-orange bg-accent-orange/10' },
  { href: '/emprestimos', label: 'Empréstimos', icon: Landmark, tone: 'text-accent-blue bg-accent-blue/10' },
]

const BOTTOM_TABS = [
  { key: 'inicio', href: '/', label: 'Início', icon: Home, match: (p: string) => p === '/' },
  { key: 'metas', href: '/metas', label: 'Metas', icon: Target, match: (p: string) => p.startsWith('/metas') },
  { key: 'mais', href: null, label: 'Mais', icon: Grid2x2, match: (p: string) => MOVIMENTACOES.some((m) => p.startsWith(m.href)) },
  {
    key: 'relatorios',
    href: '/relatorios',
    label: 'Relatórios',
    icon: BarChart2,
    match: (p: string) => p.startsWith('/relatorios'),
  },
  { key: 'perfil', href: '/convidar', label: 'Perfil', icon: User, match: (p: string) => p.startsWith('/convidar') },
] as const

export function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, household, members } = useHousehold()
  const [moreOpen, setMoreOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const otherMembers = members.filter((m) => m.id !== profile.id)

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-accent-emerald/10 text-accent-emerald' : 'text-foreground/60 hover:bg-surface-2 hover:text-foreground'
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 flex-col border-r border-border bg-surface p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-emerald text-white">
            <Wallet size={16} />
          </div>
          <span className="font-semibold">Finanças Pro</span>
        </div>
        {navLinks}
        <div className="mt-4 border-t border-border pt-3">
          <p className="truncate px-1 text-xs text-foreground/35">{email}</p>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-emerald text-white">
            <Wallet size={14} />
          </div>
          <span className="font-semibold">Finanças Pro</span>
        </div>
      </div>

      <main className="flex-1 p-4 pb-28 lg:p-8 lg:pb-8">
        <div className="mb-5 flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Olá, {profile.name.split(' ')[0]}</h1>
            <p className="text-sm text-foreground/45">
              {otherMembers.length > 0
                ? `${household.name} · compartilhada com ${otherMembers.map((m) => m.name.split(' ')[0]).join(', ')}`
                : `${household.name} · só você por aqui`}
            </p>
          </div>
        </div>
        {children}
      </main>

      {/* FAB */}
      <button
        onClick={() => setQuickAddOpen(true)}
        aria-label="Adicionar"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent-emerald text-white shadow-lg shadow-accent-emerald/30 transition-transform active:scale-95 lg:hidden"
      >
        <Plus size={24} />
      </button>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
        <div className="grid grid-cols-5">
          {BOTTOM_TABS.map(({ key, href, label, icon: Icon, match }) => {
            const active = match(pathname)
            if (key === 'mais') {
              return (
                <button
                  key={key}
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                    active ? 'text-accent-emerald' : 'text-foreground/40'
                  )}
                >
                  <Icon size={20} />
                  {label}
                </button>
              )
            }
            return (
              <Link
                key={key}
                href={href as string}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-accent-emerald' : 'text-foreground/40'
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Movimentações">
        <div className="flex flex-col gap-1.5 pb-2">
          {MOVIMENTACOES.map(({ href, label, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-surface-2"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon size={18} />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </BottomSheet>

      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  )
}
