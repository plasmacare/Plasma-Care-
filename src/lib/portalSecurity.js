import { supabase } from './supabase'

/**
 * Auto-logout for the Staff, B2B, Admin and Developer panels. Controlled
 * from Developer panel -> Settings. (The CUSTOMER account page always
 * auto-logs-out after 10 minutes and is deliberately not affected by this.)
 *
 * If the setting can't be read (e.g. the SQL hasn't been run yet, or the
 * network is down) we fall back to the SECURE default: on, 15 minutes.
 */
export const PORTAL_AUTO_LOGOUT_DEFAULT = { enabled: true, minutes: 15 }
export const PORTAL_AUTO_LOGOUT_CHOICES = [5, 10, 15, 30, 60]
export const PORTAL_SECURITY_EVENT = 'pc-portal-security-changed'

export async function fetchPortalAutoLogout() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('portal_auto_logout_enabled, portal_auto_logout_minutes')
    .eq('id', 1)
    .single()
  if (error || !data) return PORTAL_AUTO_LOGOUT_DEFAULT
  const minutes = Number(data.portal_auto_logout_minutes)
  return {
    enabled: data.portal_auto_logout_enabled !== false,
    minutes: PORTAL_AUTO_LOGOUT_CHOICES.includes(minutes) ? minutes : PORTAL_AUTO_LOGOUT_DEFAULT.minutes,
  }
}

export async function savePortalAutoLogout({ enabled, minutes }) {
  if (!PORTAL_AUTO_LOGOUT_CHOICES.includes(minutes)) throw new Error('Pick one of the listed durations.')
  const { error } = await supabase
    .from('site_settings')
    .update({ portal_auto_logout_enabled: !!enabled, portal_auto_logout_minutes: minutes })
    .eq('id', 1)
  if (error) throw error
  // let a portal session open in this same browser pick the change up straight away
  window.dispatchEvent(new Event(PORTAL_SECURITY_EVENT))
}

/**
 * The offline cache keeps recent booking lists (names, phone numbers) so
 * the portal works without internet. On a shared phone/computer that data
 * must not outlive the login, so it is wiped on every sign-in and sign-out.
 */
export async function clearPortalOfflineCaches() {
  try {
    if (typeof caches === 'undefined') return
    await caches.delete('supabase-reads')
  } catch {
    // cache storage unavailable — nothing to clear
  }
}
