import { useEffect, useState } from 'react'
import { fetchMyBulkRequests } from '../../lib/b2bData'

export default function B2BHistory() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')

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
        <div className="b2b-table-wrap">
          <table className="b2b-table">
            <thead>
              <tr><th>Submitted</th><th>Patients</th><th>Preferred Date</th><th>Notes</th><th>Status</th></tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td>{r.patients?.length || 0}</td>
                  <td>{r.preferred_date || '—'}</td>
                  <td>{r.notes || '—'}</td>
                  <td><span className={`badge badge--${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
