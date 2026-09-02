import { Navigate } from 'react-router-dom'
import { usePortalAuth } from '../lib/portalAuth.jsx'

// allow: 'staff' | 'b2b' | 'any' — which account type this route is for
export default function PortalGate({ allow, children }) {
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
        <p>Aapka account abhi tak set up nahi hua. Admin se sampark karein.</p>
      </div>
    )
  }

  if (allow !== 'any' && accountType !== allow) {
    return <Navigate to="/portal/login" replace />
  }

  // Admin must have TOTP enrolled + verified for this session before
  // reaching any staff panel content.
  if (role === 'admin') {
    if (mfaState === 'needs_enroll') return <Navigate to="/portal/mfa/enroll" replace />
    if (mfaState === 'needs_challenge') return <Navigate to="/portal/mfa/verify" replace />
  }

  return children
}
