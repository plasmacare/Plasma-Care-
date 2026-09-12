import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { logEvent } from '../../lib/telemetry'
import { getVerificationId } from '../../lib/turnstile'
import TurnstileWidget from '../../components/TurnstileWidget'
import logoIcon from '../assets/logo-icon.png'
import './portal.css'

function slugifyUsername(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20)
}

export default function RequestAccess() {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', username: '', gstin: '', address: '', message: '',
  })
  const [location, setLocation] = useState(null) // { latitude, longitude }
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState('idle') // idle | checking | available | taken
  const [usernameSuggestions, setUsernameSuggestions] = useState([])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Live-check username availability as they type (debounced).
  useEffect(() => {
    const username = form.username.trim()
    if (!username) {
      setUsernameStatus('idle')
      setUsernameSuggestions([])
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const { data: available, error: rpcErr } = await supabase.rpc('is_b2b_username_available', { check_username: username })
        if (rpcErr) throw rpcErr
        if (available) {
          setUsernameStatus('available')
          setUsernameSuggestions([])
        } else {
          setUsernameStatus('taken')
          // Offer a few quick alternatives so they don't have to guess.
          const candidates = [`${username}1`, `${username}2`, `${username}_hq`, `${username}${new Date().getFullYear()}`]
          const checks = await Promise.all(
            candidates.map(async (c) => {
              const { data: ok } = await supabase.rpc('is_b2b_username_available', { check_username: c })
              return ok ? c : null
            }),
          )
          setUsernameSuggestions(checks.filter(Boolean).slice(0, 3))
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.username])

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

  function phoneDigitsValid() {
    const digits = form.phone.replace(/\D/g, '').replace(/^91/, '')
    return /^[6-9]\d{9}$/.test(digits)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!phoneDigitsValid()) {
      setError('Enter a valid 10-digit Indian phone number (e.g. +91 98765 43210).')
      return
    }
    if (!form.username.trim()) {
      setError('Choose a username.')
      return
    }
    if (usernameStatus === 'taken') {
      setError('That username is already taken — pick one of the suggestions, or try another.')
      return
    }
    if (usernameStatus === 'checking') {
      setError('Still checking that username — one moment and try again.')
      return
    }
    if (!turnstileToken) {
      setError('Please complete the verification checkbox.')
      return
    }

    setSubmitting(true)
    try {
      const verification_id = await getVerificationId(turnstileToken, 'b2b_request')
      const digits = form.phone.replace(/\D/g, '').replace(/^91/, '')
      const { error: err } = await supabase.from('b2b_requests').insert({
        ...form,
        phone: `+91${digits}`,
        username: form.username.trim(),
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        verification_id,
      })
      if (err) throw err
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

  const canSubmit = phoneDigitsValid() && form.username.trim() && usernameStatus !== 'taken' && usernameStatus !== 'checking'

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

          <label>Contact person's phone *</label>
          <input
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          {form.phone && !phoneDigitsValid() && (
            <p className="login-error">Enter a valid 10-digit Indian mobile number.</p>
          )}

          <label>Email *</label>
          <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />

          <label>Choose a username *</label>
          <input
            required
            value={form.username}
            onChange={(e) => update('username', slugifyUsername(e.target.value))}
            placeholder="e.g. acmecorp"
          />
          {usernameStatus === 'checking' && <p className="portal-form__hint">Checking availability…</p>}
          {usernameStatus === 'available' && <p className="portal-form__hint" style={{ color: '#1B8A5A' }}>✓ Username available</p>}
          {usernameStatus === 'taken' && (
            <>
              <p className="login-error">That username is already taken.</p>
              {usernameSuggestions.length > 0 && (
                <p className="portal-form__hint">
                  Try:{' '}
                  {usernameSuggestions.map((s, i) => (
                    <span key={s}>
                      <button type="button" className="b2b-username-suggestion" onClick={() => update('username', s)}>{s}</button>
                      {i < usernameSuggestions.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
            </>
          )}

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

          <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken('')} />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={submitting || !canSubmit}>
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
