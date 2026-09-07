import { supabase } from './supabase'

export async function fetchMaintenanceSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('maintenance_customer, maintenance_staff, maintenance_b2b, maintenance_message')
    .eq('id', 1)
    .single()
  if (error) return { maintenance_customer: false, maintenance_staff: false, maintenance_b2b: false, maintenance_message: '' }
  return data
}

export function subscribeMaintenanceSettings(onChange) {
  const channel = supabase
    .channel('maintenance-settings')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
      onChange(payload.new)
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
