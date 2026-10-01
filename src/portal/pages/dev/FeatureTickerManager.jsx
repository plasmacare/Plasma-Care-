import { useEffect, useState } from 'react'
import { fetchActiveFeatureAnnouncements, addFeatureAnnouncement, deleteFeatureAnnouncement } from '../../lib/contentAdmin'

/**
 * "New feature ticker" — lives in the Developer panel (moved here from
 * Admin -> Announcements, since announcing a shipped feature is a
 * developer job). What gets posted still scrolls at the top of the
 * staff/admin panel for 24 hours, then disappears on its own. Never
 * shown to customers.
 */
export default function FeatureTickerManager() {
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setItems(await fetchActiveFeatureAnnouncements())
    } catch (err) {
      setError(err.message)
    }
  }
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!message.trim()) return
    setBusy(true)
    setError('')
    try {
      await addFeatureAnnouncement(message.trim())
      setMessage('')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteFeatureAnnouncement(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="slots-form-card">
      <h3>New feature ticker (staff/admin panel only)</h3>
      <p className="portal-form__hint" style={{ marginBottom: 12 }}>
        For a new feature shipping on the site (not a bug fix) — shows as a scrolling line at the top of the
        staff/admin panel for 24 hours, then disappears on its own. Doesn't show to customers.
      </p>
      {error && <p className="admin-error">{error}</p>}
      <form className="announcements-tab__form" onSubmit={handleAdd}>
        <input
          placeholder="e.g. New: Report Generation tab can now auto-fill test parameters"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Posting…' : 'Post to ticker'}
        </button>
      </form>
      {items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          {items.map((f) => (
            <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid #eee' }}>
              <span>{f.message}</span>
              <button type="button" className="btn btn--ghost" onClick={() => handleDelete(f.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
