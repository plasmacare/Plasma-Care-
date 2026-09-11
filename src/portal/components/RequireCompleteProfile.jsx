import { useState } from 'react'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import { supabase } from '../../lib/supabase'

/**
 * Wrap a panel's routes with this. If the logged-in account is missing
 * a field the rest of the app depends on, it blocks everything else
 * behind a one-time "complete your profile" form instead of letting
 * broken/missing data cause confusing failures elsewhere (e.g. a B2B
 * account with no address meant collection staff had nowhere to
 * navigate to).
 */
export default function RequireCompleteProfile({ children }) {
  const { accountType, staffProfile, b2bAccount, refreshAccounts } = usePortalAuth()

  const missing = accountType === 'b2b'
    ? (!b2bAccount?.address?.trim() ? ['address'] : [])
    : accountType === 'staff'
      ? (!staffProfile?.full_name?.trim() ? ['full_name'] : [])
      : []

  if (missing.length === 0) return children

  return (
    <div className="portal-screen">
      <div className="portal-card portal-card--wide">
        <h1 className="portal-card__title">Complete your profile</h1>
        <p className="portal-card__subtitle">
          A few required details are missing from your account. Fill these in to continue — everything else stays
          exactly as it was.
        </p>
        {accountType === 'b2b' && missing.includes('address') && (
          <AddressField accountId={b2bAccount.id} onDone={refreshAccounts} />
        )}
        {accountType === 'staff' && missing.includes('full_name') && (
          <NameField accountId={staffProfile.id} onDone={refreshAccounts} />
        )}
      </div>
    </div>
  )
}

function AddressField({ accountId, onDone }) {
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function captureLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setLocating(false) },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!address.trim()) {
      setError('Enter your store/office address.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase
        .from('b2b_accounts')
        .update({ address: address.trim(), latitude: location?.latitude ?? null, longitude: location?.longitude ?? null })
        .eq('id', accountId)
      if (err) throw err
      await onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="portal-form">
      <label>Full store/office address *</label>
      <textarea
        rows={2}
        required
        placeholder="This is where collection staff will come for employee checkups"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <label>Store location (optional but recommended)</label>
      <button type="button" className="btn btn--secondary" onClick={captureLocation} disabled={locating}>
        {locating ? 'Getting location…' : location ? '📍 Location captured' : '📍 Share my current location'}
      </button>
      {error && <p className="login-error">{error}</p>}
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save and continue'}
      </button>
    </form>
  )
}

function NameField({ accountId, onDone }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Enter your full name.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase.from('staff_profiles').update({ full_name: name.trim() }).eq('id', accountId)
      if (err) throw err
      await onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="portal-form">
      <label>Your full name *</label>
      <input required value={name} onChange={(e) => setName(e.target.value)} />
      {error && <p className="login-error">{error}</p>}
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save and continue'}
      </button>
    </form>
  )
}
