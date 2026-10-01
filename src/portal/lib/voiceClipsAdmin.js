import { supabase } from '../../lib/supabase'
import { uploadFileToCloudinary } from './cloudinary'

export async function uploadVoiceClip(lang, key, fileOrBlob) {
  const type = fileOrBlob.type || 'audio/webm'
  const ext = /mp4|m4a|aac/.test(type) ? 'm4a' : /mpeg|mp3/.test(type) ? 'mp3' : /wav/.test(type) ? 'wav' : /ogg|opus/.test(type) ? 'ogg' : 'webm'
  // Always re-wrap with a clean name + a real audio type — a file picked
  // from some phones arrives with an empty/odd type, which would make the
  // stored clip unplayable in the customer's browser.
  const file = new File([fileOrBlob], `${lang}-${key}-${Date.now()}.${ext}`, { type })
  const { url } = await uploadFileToCloudinary(file, `plasma-care-voice/${lang}`)
  const { error } = await supabase.from('voice_clips').upsert({ lang, key, audio_url: url, updated_at: new Date().toISOString() })
  if (error) throw error
  return url
}

export async function deleteVoiceClip(lang, key) {
  const { error } = await supabase.from('voice_clips').delete().eq('lang', lang).eq('key', key)
  if (error) throw error
}
