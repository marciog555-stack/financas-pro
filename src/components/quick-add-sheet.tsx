'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, CreditCard, Wallet, Target, Landmark } from 'lucide-react'
import { BottomSheet } from '@/components/bottom-sheet'

const OPTIONS = [
  { href: '/renda?new=1', label: 'Nova receita', icon: TrendingUp, tone: 'text-accent-emerald bg-accent-emerald/10' },
  { href: '/despesas?new=1', label: 'Nova despesa', icon: CreditCard, tone: 'text-accent-red bg-accent-red/10' },
  { href: '/beneficios?new=1', label: 'Novo benefício', icon: Wallet, tone: 'text-accent-orange bg-accent-orange/10' },
  { href: '/metas?new=1', label: 'Nova meta', icon: Target, tone: 'text-accent-purple bg-accent-purple/10' },
  { href: '/emprestimos?new=1', label: 'Novo empréstimo', icon: Landmark, tone: 'text-accent-blue bg-accent-blue/10' },
]

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()

  return (
    <BottomSheet open={open} onClose={onClose} title="O que você quer adicionar?">
      <div className="flex flex-col gap-1.5 pb-2">
        {OPTIONS.map(({ href, label, icon: Icon, tone }) => (
          <button
            key={href}
            onClick={() => {
              onClose()
              router.push(href)
            }}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-surface-2"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon size={18} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
