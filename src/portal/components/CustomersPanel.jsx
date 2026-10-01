import { useEffect, useMemo, useState } from 'react'
import { fetchAllBookingsForInsights } from '../lib/adminData'
import { buildCustomerInsights } from '../lib/customerInsights'

const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', assigned: 'Assigned',
  in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
}

const SORTS = {
  bookings: { label: 'Most bookings', fn: (a, b) => b.total - a.total || b.score - a.score },
  score: { label: 'Highest score', fn: (a, b) => b.score - a.score || b.total - a.total },
  risky: { label: 'Lowest score (risky first)', fn: (a, b) => a.score - b.score || b.total - a.total },
  recent: { label: 'Most recent', fn: (a, b) => (a.lastBookedAt < b.lastBookedAt ? 1 : -1) },
}

export default function CustomersPanel() {
  const [raw, setRaw] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState('bookers') // 'bookers' | 'patients'
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('bookings')
  const [includeB2B, setIncludeB2B] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetchAllBookingsForInsights().then(setRaw).catch((err) => setError(err.message))
  }, [])

  const insights = useMemo(() => (raw ? buildCustomerInsights(raw, { includeB2B }) : null), [raw, includeB2B])

  const list = useMemo(() => {
    if (!insights) return []
    const q = search.trim().toLowerCase()
    let rows = view === 'bookers' ? insights.bookers : insights.patients
    if (q) {
      rows = rows.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.related || []).some((x) => String(x).toLowerCase().includes(q)),
      )
    }
    return [...rows].sort(SORTS[sort].fn)
  }, [insights, view, search, sort])

  if (error) return <p className="admin-error">{error}</p>
  if (!insights) return <p className="admin-loading">Loading customers…</p>

  return (
    <div className="customers-panel">
      <div className="collections-subnav" style={{ marginBottom: 12 }}>
        <button type="button" className={view === 'bookers' ? 'active' : ''} onClick={() => { setView('bookers'); setExpanded(null) }}>
          Booked by ({insights.bookers.length})
        </button>
        <button type="button" className={view === 'patients' ? 'active' : ''} onClick={() => { setView('patients'); setExpanded(null) }}>
          Patients ({insights.patients.length})
        </button>
      </div>

      <p className="views-tab__hint">
        {view === 'bookers'
          ? 'One row per phone number that has booked — how often they booked home visits vs lab visits, and how many bookings actually went through.'
          : 'One row per patient (matched by name + gender) — the person tested may not be the person who booked, so both are tracked.'}
        {' '}Genuine score: 80+ loyal · 60–79 good · 40–59 new · under 40 risky. Based on completed vs cancelled bookings, spam flags, fake-looking names/numbers and shared IPs.
      </p>

      <div className="admin-filters">
        <input
          type="text"
          className="admin-filters__search"
          placeholder={view === 'bookers' ? 'Search name or phone' : 'Search patient name or booker phone'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="admin-filters__all">
          <input type="checkbox" checked={includeB2B} onChange={(e) => setIncludeB2B(e.target.checked)} />
          Include B2B
        </label>
      </div>

      {list.length === 0 && <p className="admin-empty">No customers match.</p>}

      <div className="admin-list">
        {list.map((c) => (
          <div key={`${c.kind}-${c.key}`} className="booking-card customer-card">
            <button type="button" className="booking-card__summary" onClick={() => setExpanded(expanded === c.key ? null : c.key)}>
              <div className="booking-card__main">
                <span className="booking-card__name">{c.name}</span>
                <span className="booking-card__meta">
                  {c.kind === 'booker'
                    ? c.phone || 'No phone'
                    : [c.gender, c.ages.length ? `${c.ages.join('/')} yrs` : null].filter(Boolean).join(' · ') || 'Patient'}
                </span>
              </div>
              <div className="booking-card__right">
                <span className={`score-pill score-pill--${c.band.tone}`}>{c.score} · {c.band.label}</span>
              </div>
            </button>

            <div className="customer-card__stats">
              <Stat label="Home visits" value={c.home} />
              <Stat label="Lab visits" value={c.lab} />
              <Stat label="Successful" value={c.successful} />
              <Stat label="Total" value={c.total} />
            </div>

            {expanded === c.key && (
              <div className="booking-card__details">
                <div className="score-bar"><div className={`score-bar__fill score-bar__fill--${c.band.tone}`} style={{ width: `${c.score}%` }} /></div>
                <p className="booking-card__meta">
                  Cancelled: {c.cancelled}{c.spam ? ` · Marked spam: ${c.spam}` : ''}
                  {c.reasons.length > 0 ? ` — ${c.reasons.join(', ')}` : ''}
                </p>
                {c.kind === 'booker' && c.otherNames?.length > 0 && (
                  <p className="booking-card__meta">Also booked as: {c.otherNames.join(', ')}</p>
                )}
                {c.related?.length > 0 && (
                  <p className="booking-card__meta">
                    {c.kind === 'booker' ? 'Booked for patients' : 'Booked by phone'}: {c.related.join(', ')}
                  </p>
                )}
                <div className="customer-card__history">
                  {c.bookings.map((b) => (
                    <div key={b.id} className="customer-card__history-row">
                      <span>{b.scheduled_date || b.created_at?.slice(0, 10)}</span>
                      <span>{b.booking_type === 'home_collection' ? 'Home' : 'Lab'}</span>
                      <span className={`badge badge--${b.status}`}>{STATUS_LABEL[b.status] || b.status}</span>
                      <span>₹{b.total_amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="customer-stat">
      <span className="customer-stat__value">{value}</span>
      <span className="customer-stat__label">{label}</span>
    </div>
  )
}
