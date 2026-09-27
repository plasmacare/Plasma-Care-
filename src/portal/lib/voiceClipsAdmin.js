import { supabase } from '../../lib/supabase'
import { uploadFileToCloudinary } from './cloudinary'

export async function uploadVoiceClip(lang, key, fileOrBlob) {
  const file = fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], `${lang}-${key}.webm`, { type: fileOrBlob.type || 'audio/webm' })
  const { url } = await uploadFileToCloudinary(file, `plasma-care-voice/${lang}`)
  const { error } = await supabase.from('voice_clips').upsert({ lang, key, audio_url: url, updated_at: new Date().toISOString() })
  if (error) throw error
  return url
}

export async function deleteVoiceClip(lang, key) {
  const { error } = await supabase.from('voice_clips').delete().eq('lang', lang).eq('key', key)
  if (error) throw error
}
