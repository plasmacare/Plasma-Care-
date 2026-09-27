import { useEffect, useState } from 'react'

let deferredPrompt = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
  })
}

/** Shown only after a guided-mode booking completes — not on every visit, so it doesn't nag people who didn't ask for help in the first place. */
export default function InstallAppPrompt({ strings }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // The browser only fires beforeinstallprompt once per session before
    // we're listening for it here in some cases — check immediately,
    // and also allow a moment for it to have already fired on load.
    const check = () => setVisible(!!deferredPrompt)
    check()
    const t = setTimeout(check, 1000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    setVisible(false)
  }

  return (
    <div className="install-app-prompt">
      <h3>{strings.installAppTitle}</h3>
      <p>{strings.installAppBody}</p>
      <div className="install-app-prompt__actions">
        <button type="button" className="btn btn--primary" onClick={handleInstall}>{strings.installApp}</button>
        <button type="button" className="btn btn--ghost" onClick={() => setVisible(false)}>{strings.notNow}</button>
      </div>
    </div>
  )
}
