'use client'

import { Paperclip, X } from 'lucide-react'
import { Label } from '@/components/ui'

export function AttachmentField({
  label,
  file,
  onChange,
}: {
  label: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      {file ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm">
          <Paperclip size={14} className="shrink-0 text-foreground/50" />
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-auto shrink-0 text-foreground/30 hover:text-accent-red"
            aria-label="Remover anexo"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-foreground/50 transition-colors hover:border-accent-emerald/60 hover:text-accent-emerald">
          <Paperclip size={14} />
          Anexar PDF ou foto
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  )
}
