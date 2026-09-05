import { useEffect, useState } from 'react'
import { fetchMyBulkRequests } from '../../lib/b2bData'

export default function B2BHistory() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchMyBulkRequests().then(setRequests).catch((err) => setError(err.message))
  }, [])

  if (requests === null) return <p>Loading…</p>

  return (
    <div>
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 16 }}>Request History</h2>
      {error && <p className="login-error">{error}</p>}
      {requests.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>No bulk requests yet.</p>
      ) : (
        <div className="b2b-history-list">
          {requests.map((r) => {
            const isOpen = expandedId === r.id
            return (
              <div key={r.id} className="b2b-history-card">
                <button
                  type="button"
                  className="b2b-history-card__summary"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <span>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  <span>{r.patients?.length || 0} patient(s)</span>
                  <span>{r.preferred_date || 'No preferred date'}</span>
                  <span className={`badge badge--${r.status}`}>{r.status}</span>
                  <span className="b2b-history-card__chevron">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="b2b-history-card__details">
                    {r.notes && <p><strong>Notes:</strong> {r.notes}</p>}
                    <div className="b2b-table-wrap">
                      <table className="b2b-table">
                        <thead>
                          <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Test / Package</th></tr>
                        </thead>
                        <tbody>
                          {(r.patients || []).map((p, i) => (
                            <tr key={i}>
                              <td>{p.name}</td>
                              <td>{p.age}</td>
                              <td>{p.gender}</td>
                              <td>{p.phone}</td>
                              <td>{p.test_label || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
