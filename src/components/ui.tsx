import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm',
        className
      )}
      {...props}
    />
  )
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm',
        variant === 'primary' &&
          'bg-gradient-to-b from-accent-emerald to-accent-emerald text-white shadow-sm shadow-accent-emerald/20 hover:brightness-110',
        variant === 'secondary' && 'bg-surface-2 text-foreground hover:bg-surface-2/70',
        variant === 'ghost' && 'text-foreground/70 hover:bg-surface-2 hover:text-foreground',
        variant === 'danger' && 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20',
        className
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-accent-emerald/60 focus:ring-2 focus:ring-accent-emerald/15',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-accent-emerald/60 focus:ring-2 focus:ring-accent-emerald/15',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent-emerald/60 focus:ring-2 focus:ring-accent-emerald/15',
        className
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-xs font-medium text-foreground/50', className)}
      {...props}
    />
  )
}

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-surface-2 text-foreground/60',
        tone === 'success' && 'bg-accent-emerald/10 text-accent-emerald',
        tone === 'warning' && 'bg-accent-orange/10 text-accent-orange',
        tone === 'danger' && 'bg-accent-red/10 text-accent-red',
        className
      )}
      {...props}
    />
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-10 text-center">
      <p className="text-sm font-medium text-foreground/60">{title}</p>
      {description && <p className="mt-1 text-xs text-foreground/35">{description}</p>}
    </div>
  )
}
