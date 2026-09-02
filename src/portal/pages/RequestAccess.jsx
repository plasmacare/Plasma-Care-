import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import logoIcon from '../assets/logo-icon.png'
import './portal.css'

export default function RequestAccess() {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', gstin: '', address: '', message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { error } = await supabase.from('b2b_requests').insert({ ...form })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Kuch galat ho gaya, dobara try karo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="portal-screen">
        <div className="portal-card">
          <img src={logoIcon} alt="" className="portal-card__logo" />
          <h1 className="portal-card__title">Request bhej di gayi</h1>
          <p className="portal-card__subtitle">
            Hamari team review karke aapko {form.email} par login details bhej degi.
          </p>
          <Link to="/" className="btn btn--ghost">Home par wapas jao</Link>
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
          Corporate health checkups, bulk bookings — form bharo, hum review karke login bhej denge.
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

          <label>Address</label>
          <textarea rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} />

          <label>Kya chahiye? (optional)</label>
          <textarea
            rows={3}
            placeholder="e.g. 200 employees ka annual health checkup"
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </form>

        <p className="portal-card__footer">
          Pehle se account hai? <Link to="/portal/login">Login karo</Link>
        </p>
      </div>
    </div>
  )
}
