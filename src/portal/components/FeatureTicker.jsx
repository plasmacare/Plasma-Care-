import { useEffect, useState } from 'react'
import { fetchActiveFeatureAnnouncements } from '../lib/contentAdmin'

const REFRESH_MS = 5 * 60 * 1000 // also doubles as the check that lets an item drop off once it's past 24h

export default function FeatureTicker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    function load() {
      fetchActiveFeatureAnnouncements().then((data) => { if (!cancelled) setItems(data) }).catch(() => {})
    }
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (items.length === 0) return null

  const text = items.map((i) => i.message).join('    •    ')

  return (
    <div className="feature-ticker">
      <span className="feature-ticker__badge">New</span>
      <div className="feature-ticker__viewport">
        <div className="feature-ticker__track">
          <span>{text}</span>
          <span aria-hidden="true">{text}</span>
        </div>
      </div>
    </div>
  )
}
