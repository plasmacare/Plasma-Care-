import { supabase } from './supabase'

/**
 * Customer accounts (Firebase) on/off switch — lives in Supabase
 * site_settings next to the other feature flags, and is controlled from
 * Developer panel -> Settings. Defaults to OFF (also if the column
 * doesn't exist yet), so nothing about accounts shows until a developer
 * deliberately turns it on.
 */
export async function fetchCustomerAccountsEnabled() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('customer_accounts_enabled')
    .eq('id', 1)
    .single()
  if (error) return false
  return !!data.customer_accounts_enabled
}

export async function setCustomerAccountsEnabled(enabled) {
  const { error } = await supabase.from('site_settings').update({ customer_accounts_enabled: enabled }).eq('id', 1)
  if (error) throw error
}

// ---------------------------------------------------------------------
// Lightweight "is a customer signed in?" marker, so pages outside /account
// (the booking page) can cheaply decide whether to load Firebase at all.
// It is only a hint — the real check is always Firebase Auth itself.
// ---------------------------------------------------------------------
const MARK = 'pc_acct_active'
const ACTIVITY = 'pc_acct_last_activity'
export const ACCOUNT_IDLE_MS = 10 * 60 * 1000

export function markAccountSignedIn(signedIn) {
  try {
    if (signedIn) {
      sessionStorage.setItem(MARK, '1')
      sessionStorage.setItem(ACTIVITY, String(Date.now()))
    } else {
      sessionStorage.removeItem(MARK)
      sessionStorage.removeItem(ACTIVITY)
    }
  } catch { /* storage blocked — accounts just won't prefill */ }
}

export function touchAccountActivity() {
  try { if (sessionStorage.getItem(MARK)) sessionStorage.setItem(ACTIVITY, String(Date.now())) } catch { /* ignore */ }
}

/** True if a customer looks signed in AND has been active within the idle limit. */
export function isAccountMarkedActive() {
  try {
    if (!sessionStorage.getItem(MARK)) return false
    const last = Number(sessionStorage.getItem(ACTIVITY) || 0)
    return Date.now() - last < ACCOUNT_IDLE_MS
  } catch {
    return false
  }
}

/** Booking page: pre-fill name/phone/saved patients for a signed-in customer. Never throws; returns null when not applicable. */
export async function loadAccountPrefill() {
  if (!isAccountMarkedActive()) return null
  try {
    const api = await import('../account/accountApi')
    return await api.loadPrefill()
  } catch {
    return null
  }
}

/** Booking page: attach a just-created booking to the signed-in customer's account. Fire-and-forget; a failure here must never affect the booking itself. */
export function linkBookingToAccount(booking) {
  if (!isAccountMarkedActive()) return
  import('../account/accountApi')
    .then((api) => api.linkBooking(booking))
    .catch(() => {})
}
