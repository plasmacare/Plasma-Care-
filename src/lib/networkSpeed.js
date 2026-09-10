// Network Information API isn't supported everywhere (notably Safari),
// so this is a helpful hint, not a hard guarantee — the /lite page is
// always reachable directly regardless of what this detects.
export function isSlowConnection() {
  const conn = typeof navigator !== 'undefined'
    ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
    : null
  if (!conn) return false
  if (conn.saveData) return true
  return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'
}
