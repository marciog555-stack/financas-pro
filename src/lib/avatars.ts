import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const BUCKET = 'avatars'

export async function uploadProfileAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File
) {
  const ext = file.name.split('.').pop()
  const path = `profile/${userId}/avatar${ext ? `.${ext}` : ''}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

export async function uploadHouseholdPhoto(
  supabase: SupabaseClient<Database>,
  householdId: string,
  file: File
) {
  const ext = file.name.split('.').pop()
  const path = `household/${householdId}/photo${ext ? `.${ext}` : ''}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

export function getAvatarUrl(path: string | null | undefined) {
  if (!path) return null
  // cache-bust: o upload usa upsert no mesmo caminho, então sem isso o navegador
  // continuaria mostrando a imagem antiga em cache após trocar a foto
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}?t=${Date.now()}`
}
