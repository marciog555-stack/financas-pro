import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const BUCKET = 'attachments'

export async function uploadAttachment(
  supabase: SupabaseClient<Database>,
  userId: string,
  folder: 'incomes' | 'loans',
  file: File
) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${folder}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  return path
}

export async function getAttachmentUrl(supabase: SupabaseClient<Database>, path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10)
  if (error) throw error
  return data.signedUrl
}
