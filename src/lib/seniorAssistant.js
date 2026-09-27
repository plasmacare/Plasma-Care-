import { supabase } from './supabase'

export async function fetchSeniorAssistantEnabled() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('senior_assistant_enabled')
    .eq('id', 1)
    .single()
  if (error) return false
  return !!data.senior_assistant_enabled
}

export async function setSeniorAssistantEnabled(enabled) {
  const { error } = await supabase.from('site_settings').update({ senior_assistant_enabled: enabled }).eq('id', 1)
  if (error) throw error
}

/** Same one-shared-table-many-channels pattern as maintenance.js — see that file for why the channel name is randomized per call. */
export function subscribeSeniorAssistantEnabled(onChange) {
  const channel = supabase
    .channel(`senior-assistant-settings-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
      onChange(!!payload.new.senior_assistant_enabled)
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
}
