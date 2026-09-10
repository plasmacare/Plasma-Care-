import { useEffect, useState } from 'react'
import { fetchPackages, fetchTests, createBooking, savePatientDetails } from '../lib/booking'

// Deliberately minimal: no SiteBackground, no images, no multi-step
// wizard, no search-as-you-type widgets — just a flat HTML form with
// the same booking.js calls the main flow uses. Priority on a slow
// connection is that the patient's details reach the database, not
// how the page looks.
export default function LiteBooking() {
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])
  const [catalogError, setCatalogError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [optionKey, setOptionKey] = useState('')
  const [address, setAddress] = useState('')
  const [wantsHomeCollection, setWantsHomeCollection] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // booking id once submitted

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => setCatalogError('Could not load the test list. Please reload this page.'))
    fetchTests().then(setTests).catch(() => {})
  }, [])

  const options = [
    ...packages.map((p) => ({ key: `pkg:${p.id}`, id: p.id, kind: 'package', name: p.name, price: p.price })),
    ...tests.map((t) => ({ key: `test:${t.id}`, id: t.id, kind: 'test', name: t.name, price: t.price })),
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !phone.trim() || !age.trim() || !gender || !optionKey) {
      setError('Please fill in all fields and pick a test/package.')
      return
    }
    if (wantsHomeCollection && !address.trim()) {
      setError('Please enter your address for home collection.')
      return
    }

    const opt = options.find((o) => o.key === optionKey)
    setSubmitting(true)
    try {
      const booking = await createBooking({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        bookingType: wantsHomeCollection ? 'home_collection' : 'lab_visit',
        selectedPackages: opt?.kind === 'package' ? [opt.id] : [],
        selectedTests: opt?.kind === 'test' ? [opt.id] : [],
        totalAmount: opt?.price || 0,
        scheduledDate: null,
        address: wantsHomeCollection ? { fullAddress: address.trim(), landmark: '', latitude: null, longitude: null } : null,
      })
      await savePatientDetails(booking.id, { name: name.trim(), age, gender, bloodGroup: '' })
      setDone(booking.id)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again — your details have not been lost, just re-submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={styles.page}>
        <p style={styles.banner}>
          You are seeing this simplified page because of a slow internet connection. This does not affect your
          booking in any way.
        </p>
        <h1 style={styles.h1}>Booking confirmed</h1>
        <p>Your booking ID is: <strong>{done.slice(0, 8).toUpperCase()}</strong></p>
        <p>Our team will call you at {phone} to confirm the date and time.</p>
        <a href="/" style={styles.link}>Back to home</a>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <p style={styles.banner}>
        You are seeing this simplified page because of a slow internet connection, but you can still complete your
        registration normally — your details will be saved properly. A more decorated version of this page is
        available once your connection improves.
      </p>

      <h1 style={styles.h1}>Book a Pathology Test</h1>

      {catalogError && <p style={styles.error}>{catalogError}</p>}

      <form onSubmit={handleSubmit}>
        <label style={styles.label}>Full name</label>
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />

        <label style={styles.label}>Phone number</label>
        <input style={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label style={styles.label}>Age</label>
        <input style={styles.input} type="number" value={age} onChange={(e) => setAge(e.target.value)} />

        <label style={styles.label}>Gender</label>
        <select style={styles.input} value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <label style={styles.label}>Test or package</label>
        <select style={styles.input} value={optionKey} onChange={(e) => setOptionKey(e.target.value)}>
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>{o.name} — ₹{o.price}</option>
          ))}
        </select>

        <label style={styles.label}>
          <input
            type="checkbox"
            checked={wantsHomeCollection}
            onChange={(e) => setWantsHomeCollection(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          I need home collection (instead of visiting the lab)
        </label>

        {wantsHomeCollection && (
          <>
            <label style={styles.label}>Address</label>
            <textarea style={{ ...styles.input, minHeight: 60 }} value={address} onChange={(e) => setAddress(e.target.value)} />
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit booking'}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        <a href="/" style={styles.link}>Use the full site instead</a>
      </p>
    </div>
  )
}

// Inline styles on purpose — no separate CSS file to fetch, no custom
// fonts, no icons. Plain system fonts render instantly on any device.
const styles = {
  page: { maxWidth: 480, margin: '0 auto', padding: '20px 16px 60px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#111' },
  banner: { background: '#FFF6E5', border: '1px solid #F3D98B', borderRadius: 6, padding: '10px 12px', fontSize: 14, lineHeight: 1.5, marginBottom: 16 },
  h1: { fontSize: 20, marginBottom: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  input: { width: '100%', fontSize: 15, padding: '8px 10px', border: '1px solid #999', borderRadius: 4, boxSizing: 'border-box' },
  button: { marginTop: 18, width: '100%', fontSize: 16, padding: '12px', background: '#C0152F', color: '#fff', border: 'none', borderRadius: 4 },
  error: { color: '#B00020', fontSize: 13, marginTop: 8 },
  link: { color: '#0B2545' },
}
