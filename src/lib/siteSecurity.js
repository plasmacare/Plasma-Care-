/**
 * IMPORTANT — read this before changing anything here.
 *
 * Everything in this file is a *deterrent*, not a security boundary.
 * Any code that runs in a browser (HTML/CSS/JS) is, by definition,
 * downloaded to the visitor's device — that's how browsers work. There
 * is no technique (obfuscation, blocking right-click, detecting
 * DevTools, redirecting on Inspect, etc.) that can make that code
 * actually unreadable to someone who wants to read it; a person with
 * basic technical knowledge can always view it via the browser's
 * network tab, curl, disabling JS, a different browser, or a dozen
 * other routes that don't involve the things blocked below.
 *
 * What actually protects the business:
 *  - Real secrets (API keys with write access, service-role keys,
 *    payment secrets) NEVER shipping in frontend code — see .env.example
 *    and the Supabase Edge Functions for where those live instead.
 *  - Supabase Row Level Security policies — the actual access-control
 *    boundary; the frontend code is just a UI on top of it.
 *  - Copyright/trademark law for anyone who copies the design wholesale.
 *
 * What THIS file does, honestly:
 *  - Discourages casual copying (right-click "View source", casual
 *    Ctrl+U, an easy Inspect-Element click) for the vast majority of
 *    visitors who won't go further than that.
 *  - Logs likely DevTools usage to the activity log (see
 *    src/lib/telemetry.js) so admins/developers have *visibility* into
 *    how often it happens — this is monitoring, not prevention, and
 *    isn't perfectly accurate (a similar-sized real monitor/window
 *    resize can occasionally trigger it too).
 *  - Does NOT redirect, block access, or otherwise punish anyone —
 *    that was deliberately left out. It breaks legitimate use (screen
 *    readers, split-screen, external monitors, the site owner's own
 *    debugging) and can get a site flagged as deceptive by browsers/
 *    Safe Browsing for force-redirecting visitors. See the conversation
 *    this was discussed in for the full reasoning.
 */

let lastDevtoolsLogAt = 0
const DEVTOOLS_LOG_COOLDOWN_MS = 5 * 60 * 1000 // don't spam the log if it stays open

function safeLog(type, message) {
  // Telemetry needs Supabase configured; import lazily and swallow any
  // failure so a monitoring hiccup can never break the site itself.
  import('./telemetry')
    .then(({ logEvent }) => logEvent({ type, source: 'system', message, severity: 'info' }))
    .catch(() => {})
}

export function printConsoleWarning() {
  const styleBig = 'color:#C0152F;font-size:32px;font-weight:bold;'
  const styleBody = 'color:#0B2545;font-size:14px;'
  // eslint-disable-next-line no-console
  console.log('%cStop!', styleBig)
  // eslint-disable-next-line no-console
  console.log(
    '%cThis is a browser feature intended for developers. If someone told you to paste something here, it is very likely a scam that could give them access to your account or someone else\'s data.',
    styleBody,
  )
}

export function installDeterrents() {
  if (typeof document === 'undefined') return

  document.addEventListener('contextmenu', (e) => {
    // Still allow the browser's native menu on things people
    // legitimately need it for — typing their own text or picking an
    // image (e.g. an uploaded prescription/report).
    const el = e.target
    const allowed = el.closest?.('input, textarea, [contenteditable="true"], img')
    if (!allowed) e.preventDefault()
  })

  document.addEventListener('keydown', (e) => {
    const key = e.key?.toUpperCase()
    const blockedCombo =
      key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(key)) ||
      ((e.ctrlKey || e.metaKey) && key === 'U')
    if (blockedCombo) e.preventDefault()
  })

  // Heuristic only (see file header) — a large gap between a window's
  // outer and inner size usually means a docked DevTools panel is open.
  let wasOpen = false
  setInterval(() => {
    const threshold = 160
    const isOpen =
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    if (isOpen && !wasOpen) {
      const now = Date.now()
      if (now - lastDevtoolsLogAt > DEVTOOLS_LOG_COOLDOWN_MS) {
        lastDevtoolsLogAt = now
        safeLog('devtools_opened', `Possible DevTools usage detected on ${window.location.pathname}`)
      }
    }
    wasOpen = isOpen
  }, 1000)
}
