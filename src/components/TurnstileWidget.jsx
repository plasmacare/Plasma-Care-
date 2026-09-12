import { useEffect, useRef, useId } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

let scriptLoadPromise = null
function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return scriptLoadPromise
}

/**
 * Renders a Cloudflare Turnstile challenge and calls onVerify(token)
 * once solved. Renders nothing (and onVerify never fires) if
 * VITE_TURNSTILE_SITE_KEY isn't configured, so local/dev builds without
 * the key don't break — just skip verification in that case.
 */
export default function TurnstileWidget({ onVerify, onExpire }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const domId = useId()

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onVerify(token),
        'expired-callback': () => onExpire?.(),
      })
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null

  return <div ref={containerRef} id={`turnstile-${domId}`} style={{ margin: '8px 0' }} />
}
