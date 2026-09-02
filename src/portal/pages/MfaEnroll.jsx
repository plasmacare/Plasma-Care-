import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import './portal.css'

export default function MfaEnroll() {
  const { role, mfaState, refreshMfa, loading, logout } = usePortalAuth()
  const [enrollment, setEnrollment] = useState(null) // { factorId, qrCode, secret }
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (mfaState !== 'needs_enroll') return
    supabase.auth.mfa.enroll({ factorType: 'totp' }).then(({ data, error }) => {
      if (error) setError(error.message)
      else setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret })
    })
  }, [mfaState])

  if (!loading && role !== 'admin') return <Navigate to="/portal/login" replace />
  if (!loading && mfaState === 'satisfied') return <Navigate to="/portal/staff" replace />

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      })
      if (chErr) throw chErr
      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.id,
        code,
      })
      if (verErr) throw verErr
      await refreshMfa()
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="portal-screen">
      <div className="portal-card">
        <h1 className="portal-card__title">Set up 2FA</h1>
        <p className="portal-card__subtitle">
          A one-time Authenticator app setup (Google Authenticator, Authy, etc.) is required for admin accounts.
        </p>

        {!enrollment ? (
          <p>Loading QR code…</p>
        ) : (
          <>
            <div className="portal-mfa-qr" dangerouslySetInnerHTML={{ __html: enrollment.qrCode }} />
            <p className="portal-form__hint">Can't scan the QR? Enter this code manually:</p>
            <div className="portal-mfa-secret">{enrollment.secret}</div>

            <form onSubmit={handleVerify} className="portal-form">
              <label>6-digit code from your app</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                className="portal-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="btn btn--primary" disabled={submitting || code.length !== 6}>
                {submitting ? 'Verifying…' : 'Verify & Enable 2FA'}
              </button>
            </form>
          </>
        )}

        <p className="portal-card__footer">
          Wrong account? <a href="#" onClick={(e) => { e.preventDefault(); logout() }}>Sign out</a>
        </p>
      </div>
    </div>
  )
}
