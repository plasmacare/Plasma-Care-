/**
 * When a Supabase write (insert/update/delete) fails because the device
 * has no network, the request is stored here instead of being lost, and
 * replayed automatically once the connection comes back — see
 * offlineFetch.js, which is what actually enqueues things. This file is
 * just the storage + replay mechanics.
 */
const KEY = 'plasma_offline_queue'
const FAILED_KEY = 'plasma_offline_queue_failed'
const listeners = new Set()

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}
function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
  notify()
}
function notify() {
  const snapshot = getStatus()
  listeners.forEach((fn) => fn(snapshot))
}

export function getStatus() {
  return { pending: readList(KEY), failed: readList(FAILED_KEY) }
}

export function subscribe(fn) {
  listeners.add(fn)
  fn(getStatus())
  return () => listeners.delete(fn)
}

export function enqueue(request) {
  const list = readList(KEY)
  list.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now(), ...request })
  writeList(KEY, list)
}

export function clearFailed() {
  writeList(FAILED_KEY, [])
}

/** Re-sends every queued request in order. Stops at the first one that still fails for a network reason (keeps ordering intact for next try); requests the server actively rejects (a real error, not "offline") move to the failed list instead of blocking the rest. */
export async function flushQueue() {
  let queue = readList(KEY)
  if (!queue.length) return
  const stillPending = []
  const nowFailed = readList(FAILED_KEY)

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    try {
      const res = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body })
      if (res.ok || res.status === 204) {
        continue // synced — drop it
      }
      const text = await res.text().catch(() => '')
      nowFailed.push({ ...item, failedAt: Date.now(), status: res.status, responseText: text.slice(0, 500) })
    } catch {
      // Network still down — keep this and everything after it queued, try again next time.
      stillPending.push(...queue.slice(i))
      break
    }
  }

  writeList(KEY, stillPending)
  writeList(FAILED_KEY, nowFailed)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue() })
}
