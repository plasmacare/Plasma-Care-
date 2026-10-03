/**
 * Copy protection for CUSTOMER pages (everything except the staff/admin/
 * B2B/developer panels, where copying must keep working — e.g. "copy
 * report link").
 *
 * What it blocks on customer pages: copy and cut (button, menu, Ctrl/Cmd+C,
 * Ctrl/Cmd+X, Ctrl+Insert), starting a text selection outside form fields,
 * the long-press / right-click menu outside form fields, and dragging
 * text/images out of the page. Pasting INTO a form field still works
 * (people need to paste a phone number or address).
 *
 * Honest limits: this stops casual copying. It cannot stop screenshots,
 * screen recording, OCR, a second phone photographing the screen, or
 * someone who reads the page source — nothing in a browser can. Real
 * protection of private data is done on the server (access rules).
 */
const isPanel = () => window.location.hash.startsWith('#/portal')
const isFormField = (el) => !!el?.closest?.('input, textarea, [contenteditable="true"]')

export function installCopyGuard() {
  if (typeof document === 'undefined' || window.__pcCopyGuard) return
  window.__pcCopyGuard = true

  const block = (e) => {
    if (isPanel()) return
    e.preventDefault()
    // also make sure nothing lands on the clipboard
    try { e.clipboardData?.setData('text/plain', '') } catch { /* ignore */ }
  }
  document.addEventListener('copy', block, true)
  document.addEventListener('cut', block, true)

  document.addEventListener('selectstart', (e) => {
    if (isPanel() || isFormField(e.target)) return
    e.preventDefault()
  }, true)

  document.addEventListener('dragstart', (e) => {
    if (isPanel()) return
    e.preventDefault()
  }, true)

  document.addEventListener('contextmenu', (e) => {
    if (isPanel() || isFormField(e.target)) return
    e.preventDefault()
  }, true)

  document.addEventListener('keydown', (e) => {
    if (isPanel()) return
    const key = e.key?.toLowerCase()
    const mod = e.ctrlKey || e.metaKey
    if ((mod && (key === 'c' || key === 'x')) || (e.ctrlKey && key === 'insert')) {
      e.preventDefault()
    }
  }, true)
}
