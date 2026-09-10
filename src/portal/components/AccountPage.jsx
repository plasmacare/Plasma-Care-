import { useState } from 'react'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import { supabase } from '../../lib/supabase'
import { logEvent } from '../../lib/telemetry'

const TAB_LABELS = {
  bookings: 'Bookings', catalog: 'Catalog', pages: 'Pages', announcements: 'Announcements',
  payments: 'Payments', views: 'Views', 'b2b-requests': 'B2B Requests', collections: 'Collections',
}

export default function AccountPage() {
  const { accountType, role, session, staffProfile, b2bAccount, visibleTabs } = usePortalAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function handlePasswordChange(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords don\u2019t match.')
      return
    }
    setSaving(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword })
      if (err) throw err
      logEvent({ type: 'password_changed', source: accountType, message: `Password changed: ${session?.user?.email}` })
      setNotice('Password updated.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="account-page">
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 4 }}>Account</h2>
      <p className="portal-form__hint" style={{ marginBottom: 16 }}>
        Only your password can be changed here. For anything else — name, role, contact details — get in touch with
        admin.
      </p>

      <div className="account-card">
        <h3>Your details</h3>
        <dl className="account-details">
          <dt>Email</dt><dd>{session?.user?.email}</dd>
          {accountType === 'staff' && (
            <>
              <dt>Name</dt><dd>{staffProfile?.full_name || '—'}</dd>
              <dt>Role</dt><dd style={{ textTransform: 'capitalize' }}>{role}</dd>
              <dt>Access</dt>
              <dd>{role === 'admin' ? 'All tabs (admin)' : (visibleTabs || []).map((t) => TAB_LABELS[t] || t).join(', ') || '—'}</dd>
            </>
          )}
          {accountType === 'b2b' && (
            <>
              <dt>Company</dt><dd>{b2bAccount?.company_name || '—'}</dd>
              <dt>Contact person</dt><dd>{b2bAccount?.contact_name || '—'}</dd>
              <dt>Phone</dt><dd>{b2bAccount?.phone || '—'}</dd>
              <dt>Username</dt><dd>{b2bAccount?.username || '—'}</dd>
              {b2bAccount?.gstin && (<><dt>GSTIN</dt><dd>{b2bAccount.gstin}</dd></>)}
            </>
          )}
        </dl>
      </div>

      {accountType === 'b2b' && (
        <div className="account-card">
          <h3>MoU Document</h3>
          {b2bAccount?.mou_url ? (
            <a href={b2bAccount.mou_url} target="_blank" rel="noreferrer" className="btn btn--secondary">
              Download MoU
            </a>
          ) : (
            <p style={{ color: 'var(--slate)', fontSize: 13 }}>Not uploaded yet — contact admin.</p>
          )}
        </div>
      )}

      <div className="account-card">
        <h3>Change password</h3>
        <form onSubmit={handlePasswordChange} className="portal-form">
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
          <label>Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} />
          {error && <p className="login-error">{error}</p>}
          {notice && <p className="portal-form__hint" style={{ color: '#1B8A5A' }}>{notice}</p>}
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
