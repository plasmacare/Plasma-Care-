import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const PortalAuthContext = createContext(null)

// All tabs the staff/admin panel currently has. 'admin' role always sees
// everything; other roles are limited to their `allowed_tabs`.
export const ALL_TABS = [
  'bookings', 'catalog', 'ai-packages', 'pages', 'announcements',
  'payments', 'views', 'b2b-requests',
]

export function PortalAuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [staffProfile, setStaffProfile] = useState(undefined) // undefined=checking, null=not staff
  const [b2bAccount, setB2bAccount] = useState(undefined)
  const [mfaState, setMfaState] = useState('checking')
  // 'checking' | 'not_required' | 'needs_enroll' | 'needs_challenge' | 'satisfied'

  const accountType = staffProfile ? 'staff' : (b2bAccount ? 'b2b' : null)
  const role = staffProfile?.role ?? (b2bAccount ? 'b2b' : null)

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
    if (currentRole !== 'admin') {
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

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function refreshMfa() {
    if (role) await evaluateMfa(role)
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
        loading,
        login,
        logout,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  )
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext)
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider')
  return ctx
}
