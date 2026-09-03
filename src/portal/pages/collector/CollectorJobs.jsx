import { useEffect, useState } from 'react'
import { fetchMyJobs, updateCollectionStatus, declineJob, subscribeToMyNewJobs } from './collectorData'
import { fetchLookups } from '../../lib/adminData'
import { logEvent } from '../../../lib/telemetry'

const NEXT_ACTION = {
  accepted: { next: 'en_route', label: 'Start — On the way' },
  en_route: { next: 'arrived', label: "I've arrived" },
  arrived: { next: 'collected', label: 'Mark sample collected' },
}

export default function CollectorJobs() {
  const [jobs, setJobs] = useState(null)
  const [lookups, setLookups] = useState({ packagesById: {}, testsById: {} })
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [newJobAlert, setNewJobAlert] = useState(false)

  async function load() {
    try {
      setJobs(await fetchMyJobs())
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    fetchLookups().then(setLookups).catch(() => {})
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToMyNewJobs(() => {
      setNewJobAlert(true)
      load()
    })
    return unsubscribe
  }, [])

  async function act(booking, status) {
    setBusyId(booking.id)
    setError('')
    try {
      await updateCollectionStatus(booking.id, status)
      logEvent({
        type: 'collection_status_changed',
        source: 'staff',
        message: `Booking ${booking.customer_name}: ${status}`,
        metadata: { booking_id: booking.id, status },
      })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function decline(booking) {
    setBusyId(booking.id)
    setError('')
    try {
      await declineJob(booking.id)
      logEvent({ type: 'collection_declined', source: 'staff', message: `Declined ${booking.customer_name}`, metadata: { booking_id: booking.id } })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (jobs === null) return <p>Loading…</p>

  return (
    <div>
      {newJobAlert && (
        <div className="collector-alert" onClick={() => setNewJobAlert(false)}>
          New job assigned — tap to dismiss
        </div>
      )}
      {error && <p className="login-error">{error}</p>}

      {jobs.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>No active jobs right now.</p>
      ) : (
        <div className="collector-jobs">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              lookups={lookups}
              busy={busyId === job.id}
              onAccept={() => act(job, 'accepted')}
              onDecline={() => decline(job)}
              onAdvance={() => act(job, NEXT_ACTION[job.collection_status]?.next)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function JobCard({ job, lookups, busy, onAccept, onDecline, onAdvance }) {
  const { packagesById, testsById } = lookups
  const items = [
    ...(job.selected_packages || []).map((id) => packagesById[id]?.name).filter(Boolean),
    ...(job.selected_tests || []).map((id) => testsById[id]?.name).filter(Boolean),
  ]
  const nextAction = NEXT_ACTION[job.collection_status]
  const mapsUrl = job.address?.latitude && job.address?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${job.address.latitude},${job.address.longitude}`
    : job.address?.full_address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address.full_address)}`
      : null

  return (
    <div className={`job-card job-card--${job.collection_status}`}>
      <div className="job-card__top">
        <span className={`badge badge--${job.collection_status}`}>{job.collection_status.replace('_', ' ')}</span>
        <span className="job-card__time">{job.scheduled_date}</span>
      </div>

      <div className="job-card__name">{job.customer_name}</div>
      <div className="job-card__items">{items.join(', ') || 'Test details unavailable'}</div>

      {job.address?.full_address && (
        <div className="job-card__address">📍 {job.address.full_address}</div>
      )}

      <div className="job-card__actions">
        {job.customer_phone && (
          <a className="btn btn--secondary" href={`tel:${job.customer_phone}`}>Call</a>
        )}
        {mapsUrl && (
          <a className="btn btn--secondary" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            Navigate
          </a>
        )}
      </div>

      <div className="job-card__primary-actions">
        {job.collection_status === 'assigned' && (
          <>
            <button className="btn btn--primary" disabled={busy} onClick={onAccept}>Accept</button>
            <button className="btn btn--ghost" disabled={busy} onClick={onDecline}>Decline</button>
          </>
        )}
        {nextAction && (
          <button className="btn btn--primary" disabled={busy} onClick={onAdvance}>
            {busy ? '…' : nextAction.label}
          </button>
        )}
      </div>
    </div>
  )
}
