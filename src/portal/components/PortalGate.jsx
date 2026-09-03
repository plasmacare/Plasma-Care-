import { Navigate } from 'react-router-dom'
import { usePortalAuth } from '../lib/portalAuth.jsx'

// allow: 'staff' | 'b2b' | 'any' — which account type this route is for.
// requireRole (optional): an exact staff_profiles.role required, on top
// of accountType — used for the Dev Pulse page so ordinary admin/staff
// can't reach it just by being "staff" type.
export default function PortalGate({ allow, requireRole, children }) {
  const { session, accountType, role, mfaState, loading } = usePortalAuth()

  if (loading) {
    return <div className="admin-splash">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/portal/login" replace />
  }

  if (!accountType) {
    return (
      <div className="admin-splash">
        <p>Your account isn't set up yet. Please contact an admin.</p>
      </div>
    )
  }

  if (allow !== 'any' && accountType !== allow) {
    return <Navigate to="/portal/login" replace />
  }

  if (requireRole && role !== requireRole) {
    return (
      <div className="admin-splash">
        <p>You don't have access to this page.</p>
      </div>
    )
  }

  // Admin and developer both need TOTP enrolled + verified for this
  // session before reaching any protected content.
  if (role === 'admin' || role === 'developer') {
    if (mfaState === 'needs_enroll') return <Navigate to="/portal/mfa/enroll" replace />
    if (mfaState === 'needs_challenge') return <Navigate to="/portal/mfa/verify" replace />
  }

  return children
}
