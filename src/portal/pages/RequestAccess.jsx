import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { logEvent } from '../../lib/telemetry'
import logoIcon from '../assets/logo-icon.png'
import './portal.css'

export default function RequestAccess() {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', gstin: '', address: '', message: '',
  })
  const [location, setLocation] = useState(null) // { latitude, longitude }
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationError('Location isn\u2019t supported on this device/browser.')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        setLocationError(err.message || 'Could not get your location — check location permission.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { error } = await supabase.from('b2b_requests').insert({
        ...form,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      })
      if (error) throw error
      logEvent({ type: 'b2b_request_submitted', source: 'b2b', message: `New B2B request: ${form.company_name}`, metadata: { email: form.email } })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong, please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="portal-screen">
        <div className="portal-card">
          <img src={logoIcon} alt="" className="portal-card__logo" />
          <h1 className="portal-card__title">Request submitted</h1>
          <p className="portal-card__subtitle">
            Our team will review it and send login details to {form.email}.
          </p>
          <Link to="/" className="btn btn--ghost">Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-screen">
      <div className="portal-card portal-card--wide">
        <img src={logoIcon} alt="" className="portal-card__logo" style={{ display: 'block', margin: '0 auto 12px' }} />
        <h1 className="portal-card__title" style={{ textAlign: 'center' }}>B2B Partner Access</h1>
        <p className="portal-card__subtitle" style={{ textAlign: 'center' }}>
          Corporate health checkups, bulk bookings — fill the form and we'll review and send login details.
        </p>

        <form onSubmit={handleSubmit} className="portal-form">
          <label>Company / Organisation name *</label>
          <input required value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />

          <label>Contact person *</label>
          <input required value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} />

          <label>Email *</label>
          <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />

          <label>Phone *</label>
          <input type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />

          <label>GSTIN (optional)</label>
          <input value={form.gstin} onChange={(e) => update('gstin', e.target.value)} />

          <label>Full store/office address *</label>
          <textarea
            rows={2}
            required
            placeholder="Type the complete address — this is where collection staff will come for employee checkups"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
          />

          <label>Store location</label>
          <button type="button" className="btn btn--secondary" onClick={captureLocation} disabled={locating}>
            {locating ? 'Getting location…' : location ? '📍 Location captured — tap to update' : '📍 Share my current location'}
          </button>
          {locationError && <p className="login-error">{locationError}</p>}
          <p className="portal-form__hint">
            Helps staff navigate directly to your store/office. Allow location access when prompted.
          </p>

          <label>What do you need? (optional)</label>
          <textarea
            rows={3}
            placeholder="e.g. Annual health checkup for 200 employees"
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </form>

        <p className="portal-card__footer">
          Already have an account? <Link to="/portal/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

