import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5',
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
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-emerald-600 text-white hover:bg-emerald-500',
        variant === 'secondary' &&
          'bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15',
        variant === 'ghost' && 'text-foreground hover:bg-black/5 dark:hover:bg-white/10',
        variant === 'danger' && 'bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:text-red-400',
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
        'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 dark:border-white/10 dark:bg-black/20',
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
        'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 dark:border-white/10 dark:bg-black/20',
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
        'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 dark:border-white/10 dark:bg-black/20',
        className
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1 block text-xs font-medium text-foreground/60', className)}
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
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-black/5 text-foreground/70 dark:bg-white/10',
        tone === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        tone === 'warning' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        tone === 'danger' && 'bg-red-500/10 text-red-600 dark:text-red-400',
        className
      )}
      {...props}
    />
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 py-10 text-center dark:border-white/10">
      <p className="text-sm font-medium text-foreground/70">{title}</p>
      {description && <p className="mt-1 text-xs text-foreground/40">{description}</p>}
    </div>
  )
}
