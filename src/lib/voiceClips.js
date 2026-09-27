import { supabase } from './supabase'

/** Returns { [key]: audioUrl } for a given language (e.g. 'or'). */
export async function fetchVoiceClips(lang) {
  const { data, error } = await supabase.from('voice_clips').select('key, audio_url').eq('lang', lang)
  if (error) return {}
  return Object.fromEntries((data || []).map((row) => [row.key, row.audio_url]))
}
