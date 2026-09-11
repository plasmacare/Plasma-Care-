import { useEffect, useState } from 'react'
import { fetchMyBulkRequests, fetchBookingsForBulkRequest } from '../../lib/b2bData'

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  sample_collected: 'Sample Collected',
  report_ready: 'Report Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function B2BHistory() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [bookingsByRequest, setBookingsByRequest] = useState({})

  useEffect(() => {
    fetchMyBulkRequests().then(setRequests).catch((err) => setError(err.message))
  }, [])

  async function toggle(id) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!bookingsByRequest[id]) {
      try {
        const bookings = await fetchBookingsForBulkRequest(id)
        setBookingsByRequest((prev) => ({ ...prev, [id]: bookings }))
      } catch (err) {
        setError(err.message)
      }
    }
  }

  if (requests === null) return <p>Loading…</p>

  return (
    <div>
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 16 }}>Registration History</h2>
      {error && <p className="login-error">{error}</p>}
      {requests.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>No registrations yet.</p>
      ) : (
        <div className="b2b-history-list">
          {requests.map((r) => {
            const isOpen = expandedId === r.id
            const bookings = bookingsByRequest[r.id]
            const patient = r.patients?.[0]
            const booking = bookings?.[0]
            return (
              <div key={r.id} className="b2b-history-card">
                <button
                  type="button"
                  className="b2b-history-card__summary"
                  onClick={() => toggle(r.id)}
                >
                  <span>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  <span>{patient?.name || '—'}</span>
                  <span>{patient?.tests?.length || 0} test(s)</span>
                  <span className="b2b-history-card__chevron">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && patient && (
                  <div className="b2b-history-card__details">
                    <p>
                      <strong>{patient.name}</strong> — {patient.age} yrs, {patient.gender}
                      {patient.phone ? ` — ${patient.phone}` : ''}
                    </p>
                    {r.notes && <p><strong>Notes:</strong> {r.notes}</p>}
                    <div className="b2b-table-wrap">
                      <table className="b2b-table">
                        <thead>
                          <tr><th>Test / Package</th><th>Collected at</th><th>Price</th></tr>
                        </thead>
                        <tbody>
                          {(patient.tests || []).map((t, i) => (
                            <tr key={i}>
                              <td>{t.test_label || '—'}</td>
                              <td>{t.time || '—'}</td>
                              <td>₹{t.price || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ marginTop: 10 }}>
                      <strong>Status:</strong>{' '}
                      {booking ? (
                        <span className={`badge badge--${booking.status}`}>
                          {STATUS_LABEL[booking.status] || booking.status}
                        </span>
                      ) : bookings ? '—' : 'Loading…'}
                      {booking?.report_url && (
                        <>
                          {' — '}
                          <a href={booking.report_url} target="_blank" rel="noreferrer">Download report</a>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
