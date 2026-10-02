import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { logEvent } from '../../lib/telemetry'
import IdleGuard, { clearIdleMarker } from '../../components/IdleGuard'
import {
  fetchPortalAutoLogout, PORTAL_AUTO_LOGOUT_DEFAULT, PORTAL_SECURITY_EVENT, clearPortalOfflineCaches,
} from '../../lib/portalSecurity'

const PortalAuthContext = createContext(null)

// All tabs the staff/admin panel currently has. 'admin' role always sees
// everything; other roles are limited to their `allowed_tabs`.
export const ALL_TABS = [
  'bookings', 'catalog', 'pages', 'announcements',
  'payments', 'views', 'b2b-requests', 'collections', 'reports',
]

export function PortalAuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [staffProfile, setStaffProfile] = useState(undefined) // undefined=checking, null=not staff
  const [b2bAccount, setB2bAccount] = useState(undefined)
  const [mfaState, setMfaState] = useState('checking')
  const [autoLogout, setAutoLogout] = useState(PORTAL_AUTO_LOGOUT_DEFAULT) // set from Developer panel -> Settings
  // 'checking' | 'not_required' | 'needs_enroll' | 'needs_challenge' | 'satisfied'

  // b2b_accounts takes priority on purpose: the only way that row
  // exists is a deliberate admin approval, whereas a staff_profiles row
  // can appear for any new login via the auto-provisioning trigger
  // (including B2B ones) — this stops a B2B account being mistaken for
  // staff even if a stray staff_profiles row slips through.
  const accountType = b2bAccount ? 'b2b' : (staffProfile ? 'staff' : null)
  const role = b2bAccount ? 'b2b' : (staffProfile?.role ?? null)

  async function loadAccounts(userId) {
    const [{ data: sp }, { data: b2b }] = await Promise.all([
      supabase.from('staff_profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('b2b_accounts').select('*').eq('id', userId).maybeSingle(),
    ])
    if (sp && !sp.is_active) {
      await supabase.auth.signOut()
      return
    }
    if (b2b && !b2b.is_active) {
      await supabase.auth.signOut()
      return
    }
    setStaffProfile(sp || null)
    setB2bAccount(b2b || null)
  }

  const evaluateMfa = useCallback(async (currentRole) => {
    // Admin AND developer both require 2FA — developer sees the
    // site-wide activity log (Dev Pulse), which is sensitive enough
    // to warrant the same protection as admin.
    if (currentRole !== 'admin' && currentRole !== 'developer') {
      setMfaState('not_required')
      return
    }
    const { data: factorsData } = await supabase.auth.mfa.listFactors()
    const verifiedTotp = factorsData?.totp?.find((f) => f.status === 'verified')
    if (!verifiedTotp) {
      setMfaState('needs_enroll')
      return
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setMfaState(aal.currentLevel === 'aal2' ? 'satisfied' : 'needs_challenge')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) await loadAccounts(data.session.user.id)
      else { setStaffProfile(null); setB2bAccount(null) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) {
        await loadAccounts(s.user.id)
      } else {
        setStaffProfile(null)
        setB2bAccount(null)
        setMfaState('checking')
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (staffProfile === undefined || b2bAccount === undefined) return
    const r = staffProfile?.role ?? (b2bAccount ? 'b2b' : null)
    if (!r) { setMfaState('not_required'); return }
    evaluateMfa(r)
  }, [staffProfile, b2bAccount, evaluateMfa])

  // Once we KNOW nobody is signed in (session === null, not "still
  // checking"), forget the inactivity timestamp so a later fresh login
  // never inherits an old one.
  useEffect(() => {
    if (session === null) clearIdleMarker('portal')
  }, [session])

  // Developer-controlled auto-logout setting: load once signed in, and
  // re-load whenever the Developer panel saves a change in this browser.
  const signedInUserId = session?.user?.id
  useEffect(() => {
    if (!signedInUserId) return undefined
    let cancelled = false
    const load = () => fetchPortalAutoLogout().then((v) => { if (!cancelled) setAutoLogout(v) })
    load()
    window.addEventListener(PORTAL_SECURITY_EVENT, load)
    return () => { cancelled = true; window.removeEventListener(PORTAL_SECURITY_EVENT, load) }
  }, [signedInUserId])

  // While auto-logout is switched off, drop the stored activity time so
  // that switching it back on later doesn't sign people out instantly.
  useEffect(() => {
    if (!autoLogout.enabled) clearIdleMarker('portal')
  }, [autoLogout.enabled])

  async function login(email, password) {
    // never let a previous person's cached lists show up for this login
    await clearPortalOfflineCaches()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      logEvent({ type: 'login_failed', source: 'staff', severity: 'warning', message: `Login failed for ${email}` })
      throw error
    }
    logEvent({ type: 'login_success', source: 'staff', message: `Portal login: ${email}` })
  }

  async function logout() {
    clearIdleMarker('portal')
    clearPortalOfflineCaches()
    try {
      await supabase.auth.signOut()
    } catch {
      // offline or server unreachable — still drop the local session
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    }
  }

  // Bank-style inactivity sign-out for every portal login (staff, admin,
  // developer, B2B). On/off and the number of minutes are set in
  // Developer panel -> Settings; defaults to on / 15 minutes.
  async function handleIdleTimeout() {
    logEvent({ type: 'session_timeout', source: 'staff', message: 'Portal session signed out after inactivity' })
    await logout()
  }

  async function refreshMfa() {
    if (role) await evaluateMfa(role)
  }

  // Re-fetches the current user's own rows — used after they fill in a
  // missing required field (see RequireCompleteProfile) so the gate
  // clears without needing a full re-login.
  async function refreshAccounts() {
    if (session?.user) await loadAccounts(session.user.id)
  }

  const visibleTabs = role === 'admin' ? ALL_TABS : (staffProfile?.allowed_tabs || [])

  const loading =
    session === undefined ||
    (session && (staffProfile === undefined || b2bAccount === undefined)) ||
    (session && role && mfaState === 'checking')

  return (
    <PortalAuthContext.Provider
      value={{
        session,
        staffProfile,
        b2bAccount,
        accountType,
        role,
        visibleTabs,
        mfaState,
        refreshMfa,
        refreshAccounts,
        loading,
        login,
        logout,
      }}
    >
      <IdleGuard enabled={!!session && autoLogout.enabled} timeoutMinutes={autoLogout.minutes} warnSeconds={60} scope="portal" persist="local" onTimeout={handleIdleTimeout} />
      {children}
    </PortalAuthContext.Provider>
  )
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext)
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider')
  return ctx
}
