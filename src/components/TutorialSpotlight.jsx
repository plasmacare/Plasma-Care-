import { useEffect, useState } from 'react'

/**
 * Dims/blurs the whole screen except one target element (elevated above
 * the dim layer via a temporary CSS class), draws a highlight ring
 * around it, and shows a subtitle-style caption — the same pattern
 * mobile games use for guided tutorials. `targetRef` is a React ref to
 * the element to spotlight; pass null/undefined to render nothing.
 */
export default function TutorialSpotlight({ targetRef, caption, skipLabel, onSkip }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    const el = targetRef?.current
    if (!el) {
      setRect(null)
      return
    }
    el.classList.add('tutorial-spotlight-target')
    // z-index only works on positioned elements — but forcing
    // position:relative onto something already fixed/sticky (like the
    // Continue footer) would break its layout, so only touch elements
    // that are currently static.
    const wasStatic = window.getComputedStyle(el).position === 'static'
    if (wasStatic) el.style.position = 'relative'

    function update() {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const interval = setInterval(update, 300) // covers layout shifts a scroll/resize listener alone would miss

    return () => {
      el.classList.remove('tutorial-spotlight-target')
      if (wasStatic) el.style.position = ''
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      clearInterval(interval)
    }
  }, [targetRef, targetRef?.current])

  if (!rect) return null

  return (
    <>
      <div className="tutorial-spotlight-dim" onClick={(e) => e.stopPropagation()} />
      <div
        className="tutorial-spotlight-ring"
        style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
      />
      <div className="tutorial-spotlight-caption">
        <p>{caption}</p>
        {onSkip && <button type="button" onClick={onSkip}>{skipLabel}</button>}
      </div>
    </>
  )
}
