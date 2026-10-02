/**
 * Browser-side "too many wrong passwords" lock: 5 failures within 15
 * minutes locks the sign-in form for 15 minutes. This is only a speed
 * bump and a clearer message for honest users — it can be bypassed by
 * clearing site data. The real brute-force protection is Firebase's own
 * server-side throttling (auth/too-many-requests) plus App Check.
 */
const KEY = 'pc_acct_fails'
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 5

function read() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]')
    const now = Date.now()
    return Array.isArray(arr) ? arr.filter((t) => typeof t === 'number' && now - t < WINDOW_MS) : []
  } catch {
    return []
  }
}

export function recordFailure() {
  const fails = read()
  fails.push(Date.now())
  try { localStorage.setItem(KEY, JSON.stringify(fails)) } catch { /* ignore */ }
}

export function clearFailures() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

/** Milliseconds left on the lock (0 if not locked). */
export function lockRemainingMs() {
  const fails = read()
  if (fails.length < MAX_FAILS) return 0
  return Math.max(0, fails[0] + WINDOW_MS - Date.now())
}
