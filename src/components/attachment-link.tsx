'use client'

import { useState } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAttachmentUrl } from '@/lib/attachments'

export function AttachmentLink({ path }: { path: string }) {
  const [loading, setLoading] = useState(false)

  async function open() {
    setLoading(true)
    try {
      const supabase = createClient()
      const url = await getAttachmentUrl(supabase, path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
      Anexo
    </button>
  )
}
