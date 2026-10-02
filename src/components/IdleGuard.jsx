import { useEffect, useRef, useState } from 'react'
import './IdleGuard.css'

const EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'input']

function store(persist) {
  try { return persist === 'session' ? sessionStorage : localStorage } catch { return null }
}

/** Forget the stored "last active" time — call on an explicit sign-out. */
export function clearIdleMarker(scope, persist = 'local') {
  try { store(persist)?.removeItem(`pc_last_activity_${scope}`) } catch { /* ignore */ }
}

/**
 * Bank-style inactivity sign-out. After `timeoutMinutes` with no
 * touch/keyboard/scroll it signs the person out (calls onTimeout); for
 * the last `warnSeconds` it shows a "stay signed in?" prompt. The last
 * activity time is also stored, so coming back to a long-abandoned tab
 * or a browser that restored an old session signs out straight away
 * instead of showing private data.
 *
 * persist='session' stores that time per-tab (use when the login itself
 * only lives for the tab); 'local' for logins that survive restarts.
 */
export default function IdleGuard({ enabled, timeoutMinutes = 10, warnSeconds = 60, scope = 'app', persist = 'local', onTimeout }) {
  const [secondsLeft, setSecondsLeft] = useState(null)
  const lastActive = useRef(Date.now())
  const warningShown = useRef(false)
  const timeoutRef = useRef(onTimeout)
  timeoutRef.current = onTimeout

  useEffect(() => {
    if (!enabled) {
      warningShown.current = false
      setSecondsLeft(null)
      return undefined
    }
    const timeoutMs = timeoutMinutes * 60 * 1000
    const warnMs = warnSeconds * 1000
    const key = `pc_last_activity_${scope}`
    const area = store(persist)

    const stored = Number(area?.getItem(key) || 0)
    if (stored && Date.now() - stored > timeoutMs) {
      area?.removeItem(key)
      timeoutRef.current?.()
      return undefined
    }
    lastActive.current = Date.now()
    let lastWrite = 0
    function remember(now) {
      if (now - lastWrite > 5000) {
        lastWrite = now
        try { area?.setItem(key, String(now)) } catch { /* ignore */ }
      }
    }
    remember(Date.now())

    function onActivity() {
      if (warningShown.current) return // once warned, only the button counts
      const now = Date.now()
      lastActive.current = now
      remember(now)
    }

    let fired = false
    function check() {
      if (fired) return
      const idle = Date.now() - lastActive.current
      if (idle >= timeoutMs) {
        fired = true // sign-out is async; never trigger it twice
        warningShown.current = false
        setSecondsLeft(null)
        try { area?.removeItem(key) } catch { /* ignore */ }
        timeoutRef.current?.()
      } else if (idle >= timeoutMs - warnMs) {
        warningShown.current = true
        setSecondsLeft(Math.max(1, Math.ceil((timeoutMs - idle) / 1000)))
      }
    }

    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }))
    document.addEventListener('visibilitychange', check)
    const timer = setInterval(check, 1000)
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }))
      document.removeEventListener('visibilitychange', check)
      clearInterval(timer)
    }
  }, [enabled, timeoutMinutes, warnSeconds, scope, persist])

  function stay() {
    warningShown.current = false
    lastActive.current = Date.now()
    try { store(persist)?.setItem(`pc_last_activity_${scope}`, String(Date.now())) } catch { /* ignore */ }
    setSecondsLeft(null)
  }

  if (!enabled || secondsLeft === null) return null
  return (
    <div className="idle-guard" role="alertdialog" aria-modal="true" aria-labelledby="idle-guard-title">
      <div className="idle-guard__box">
        <h2 id="idle-guard-title">Still there?</h2>
        <p>For your security you will be signed out in <strong>{secondsLeft}</strong> seconds because there has been no activity.</p>
        <button type="button" className="btn btn--primary btn--block" onClick={stay}>Stay signed in</button>
      </div>
    </div>
  )
}
