'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-backdrop-in bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl animate-sheet-up',
          'sm:max-w-lg sm:rounded-3xl sm:animate-sheet-in',
          className
        )}
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-2 sm:hidden" />
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3 sm:pt-5">
          {title ? <h2 className="text-base font-semibold">{title}</h2> : <span />}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">{children}</div>
      </div>
    </div>,
    document.body
  )
}
