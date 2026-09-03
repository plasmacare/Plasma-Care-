import { useEffect, useState } from 'react'
import { fetchMyHistory } from './collectorData'

export default function CollectorHistory() {
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyHistory().then(setJobs).catch((err) => setError(err.message))
  }, [])

  if (jobs === null) return <p>Loading…</p>

  return (
    <div>
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 16 }}>History</h2>
      {error && <p className="login-error">{error}</p>}
      {jobs.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>No completed jobs yet.</p>
      ) : (
        <div className="collector-jobs">
          {jobs.map((job) => (
            <div key={job.id} className={`job-card job-card--${job.collection_status}`}>
              <div className="job-card__top">
                <span className={`badge badge--${job.collection_status}`}>{job.collection_status}</span>
                <span className="job-card__time">{job.scheduled_date}</span>
              </div>
              <div className="job-card__name">{job.customer_name}</div>
              {job.address?.full_address && <div className="job-card__address">📍 {job.address.full_address}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
