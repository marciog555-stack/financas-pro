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
        <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/20">
          <Paperclip size={14} className="shrink-0 text-foreground/50" />
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-auto shrink-0 text-foreground/30 hover:text-red-500"
            aria-label="Remover anexo"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-black/15 px-3 py-2 text-sm text-foreground/50 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-white/15">
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
