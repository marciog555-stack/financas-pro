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
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useHousehold } from '@/lib/household-context'
import { cn } from '@/lib/cn'

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

export function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, household, members } = useHousehold()
  const [mobileOpen, setMobileOpen] = useState(false)

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
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-emerald-600 text-white'
                : 'text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10'
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
      <aside className="hidden w-60 flex-col border-r border-black/5 bg-white p-4 dark:border-white/10 dark:bg-black/20 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Wallet size={16} />
          </div>
          <span className="font-semibold">Finanças Pro</span>
        </div>
        {navLinks}
        <div className="mt-4 border-t border-black/5 pt-3 dark:border-white/10">
          <p className="truncate px-1 text-xs text-foreground/40">{email}</p>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-black/20 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Wallet size={14} />
          </div>
          <span className="font-semibold">Finanças Pro</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-b border-black/5 bg-white p-4 dark:border-white/10 dark:bg-black/20 lg:hidden">
          {navLinks}
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2.5 rounded-lg border-t border-black/5 px-3 pt-3 text-sm font-medium text-foreground/70 dark:border-white/10"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      )}

      <main className="flex-1 p-4 lg:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Olá, {profile.name.split(' ')[0]}</h1>
            <p className="text-sm text-foreground/50">
              {otherMembers.length > 0
                ? `${household.name} · compartilhada com ${otherMembers.map((m) => m.name.split(' ')[0]).join(', ')}`
                : `${household.name} · só você por aqui`}
            </p>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
