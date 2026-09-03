import { useEffect, useMemo, useState } from 'react'
import { usePortalAuth } from '../../lib/portalAuth.jsx'
import { fetchRecentLogs, fetchLogCounts, subscribeToLogs } from './devLogs'
import '../portal.css'
import './devPulse.css'

const SOURCES = ['customer', 'staff', 'admin', 'b2b', 'system']
const SEVERITIES = ['error', 'warning', 'info']

export default function DevPulse() {
  const { logout } = usePortalAuth()
  const [logs, setLogs] = useState(null)
  const [counts, setCounts] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      const [logsData, countsData] = await Promise.all([
        fetchRecentLogs({ severity: severityFilter || undefined, source: sourceFilter || undefined }),
        fetchLogCounts(),
      ])
      setLogs(logsData)
      setCounts(countsData)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, sourceFilter])

  useEffect(() => {
    const unsubscribe = subscribeToLogs((row) => {
      setLogs((prev) => (prev ? [row, ...prev].slice(0, 300) : [row]))
    })
    return unsubscribe
  }, [])

  const filtered = useMemo(() => {
    if (!logs) return null
    if (!search.trim()) return logs
    const q = search.toLowerCase()
    return logs.filter(
      (l) =>
        l.message?.toLowerCase().includes(q) ||
        l.event_type?.toLowerCase().includes(q) ||
        l.actor_label?.toLowerCase().includes(q) ||
        l.path?.toLowerCase().includes(q),
    )
  }, [logs, search])

  return (
    <div className="dev-pulse">
      <header className="dev-pulse__header">
        <div>
          <h1>Dev Pulse</h1>
          <p>Live activity &amp; error feed — every layer of the site, one stream.</p>
        </div>
        <button className="btn btn--ghost" onClick={logout}>Logout</button>
      </header>

      {error && <p className="login-error">{error}</p>}

      <div className="dev-pulse__stats">
        <div className="dev-pulse__stat dev-pulse__stat--error">
          <div className="dev-pulse__stat-value">{counts?.errorsToday ?? '—'}</div>
          <div className="dev-pulse__stat-label">Errors today</div>
        </div>
        <div className="dev-pulse__stat">
          <div className="dev-pulse__stat-value">{counts?.actionsToday ?? '—'}</div>
          <div className="dev-pulse__stat-label">Events today</div>
        </div>
        <div className="dev-pulse__stat">
          <div className="dev-pulse__stat-value">{counts?.totalLogs ?? '—'}</div>
          <div className="dev-pulse__stat-label">Total logged</div>
        </div>
      </div>

      <div className="dev-pulse__filters">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search message, type, actor, path…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered === null ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>No events match this filter.</p>
      ) : (
        <div className="dev-pulse__list">
          {filtered.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`dev-log dev-log--${log.severity}`}>
      <button className="dev-log__summary" onClick={() => setExpanded((e) => !e)}>
        <span className={`dev-log__sev dev-log__sev--${log.severity}`}>{log.severity}</span>
        <span className="dev-log__source">{log.source}</span>
        <span className="dev-log__type">{log.event_type}</span>
        <span className="dev-log__message">{log.message}</span>
        <span className="dev-log__time">{new Date(log.created_at).toLocaleTimeString('en-IN')}</span>
      </button>
      {expanded && (
        <div className="dev-log__details">
          <div><strong>Path:</strong> {log.path || '—'}</div>
          <div><strong>Actor:</strong> {log.actor_label || 'anonymous'}</div>
          <div><strong>Session:</strong> {log.session_id || '—'}</div>
          <div><strong>Time:</strong> {new Date(log.created_at).toLocaleString('en-IN')}</div>
          {log.metadata && (
            <pre className="dev-log__meta">{JSON.stringify(log.metadata, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  )
}
