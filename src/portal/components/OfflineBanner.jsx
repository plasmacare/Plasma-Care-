import { useEffect, useState } from 'react'
import { subscribe, flushQueue, clearFailed } from '../../lib/offlineQueue'

export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [status, setStatus] = useState({ pending: [], failed: [] })
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    const unsubscribe = subscribe(setStatus)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      unsubscribe()
    }
  }, [])

  async function handleSyncNow() {
    setSyncing(true)
    await flushQueue()
    setSyncing(false)
  }

  if (online && status.pending.length === 0 && status.failed.length === 0) return null

  return (
    <div
      style={{
        background: online ? '#0B2545' : '#C0152F',
        color: '#fff',
        padding: '8px 16px',
        fontSize: 13.5,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 500,
      }}
    >
      <span>
        {!online && 'You\'re offline — changes are being saved on this device and will sync automatically.'}
        {online && status.pending.length > 0 && `Back online — syncing ${status.pending.length} saved change${status.pending.length === 1 ? '' : 's'}…`}
        {online && status.pending.length === 0 && status.failed.length > 0 && `${status.failed.length} change${status.failed.length === 1 ? '' : 's'} couldn't sync — review below.`}
      </span>
      {status.pending.length > 0 && (
        <span style={{ opacity: 0.85 }}>({status.pending.length} pending)</span>
      )}
      {online && status.pending.length > 0 && (
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
        >
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      )}
      {status.failed.length > 0 && (
        <details style={{ width: '100%' }}>
          <summary style={{ cursor: 'pointer' }}>What failed to sync?</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {status.failed.map((f) => (
              <li key={f.id} style={{ marginBottom: 4 }}>
                {f.method} {f.url.split('/rest/v1/')[1] || f.url} — server said: {f.responseText || `HTTP ${f.status}`}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clearFailed}
            style={{ marginTop: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </details>
      )}
    </div>
  )
}
