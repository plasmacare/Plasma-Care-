import { useEffect, useRef, useState } from 'react'
import { saveTemplateFields } from '../lib/reportTemplates'

const RENDER_WIDTH = 800 // px — canvas is rendered at this width regardless of the PDF's native size

export default function TemplateFieldMapper({ template, onClose, onSaved }) {
  const canvasRef = useRef(null)
  const [pageSize, setPageSize] = useState({ width: RENDER_WIDTH, height: RENDER_WIDTH * 1.414 })
  const [fields, setFields] = useState(template.fields || [])
  const [nextLabel, setNextLabel] = useState('patientName')
  const [nextFontSize, setNextFontSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

        const loadingTask = pdfjsLib.getDocument(template.downloadURL)
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = RENDER_WIDTH / baseViewport.width
        const viewport = page.getViewport({ scale })
        if (cancelled) return

        const canvas = canvasRef.current
        canvas.width = viewport.width
        canvas.height = viewport.height
        setPageSize({ width: viewport.width, height: viewport.height })
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not render this PDF for mapping.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    render()
    return () => { cancelled = true }
  }, [template.downloadURL])

  function handleCanvasClick(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const xPx = e.clientX - rect.left
    const yPx = e.clientY - rect.top
    const xPct = (xPx / rect.width) * 100
    const yPct = (yPx / rect.height) * 100
    if (!nextLabel.trim()) {
      setError('Give this field a name before clicking on the page.')
      return
    }
    setError('')
    setFields((prev) => [
      ...prev,
      { key: nextLabel.trim(), xPct: Number(xPct.toFixed(2)), yPct: Number(yPct.toFixed(2)), fontSize: Number(nextFontSize) || 10 },
    ])
  }

  function removeField(idx) {
    setFields((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await saveTemplateFields(template.id, fields)
      onSaved({ ...template, fields })
    } catch (err) {
      setError(err.message || 'Could not save field positions.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(11, 37, 69, 0.55)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '32px 16px', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: 980, width: '100%', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Map fields — {template.testName}</h3>
        <p className="portal-form__hint">
          Type a field name below, then click the exact spot on the format where that value should print.
          Add one field per click — repeat for every value this format needs (patient details, plus one
          field per result row for multi-parameter panels).
        </p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            placeholder="Field name, e.g. patientName, value_sgot"
            value={nextLabel}
            onChange={(e) => setNextLabel(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Font size
            <input
              type="number"
              min={6}
              max={24}
              value={nextFontSize}
              onChange={(e) => setNextFontSize(e.target.value)}
              style={{ width: 60 }}
            />
          </label>
        </div>

        {error && <p className="login-error">{error}</p>}

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', border: '1px solid #ccc', width: pageSize.width, maxWidth: '100%' }}>
            {loading && <p style={{ padding: 16 }}>Loading format…</p>}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ display: loading ? 'none' : 'block', width: '100%', cursor: 'crosshair' }}
            />
            {fields.map((f, i) => (
              <div
                key={i}
                title={f.key}
                style={{
                  position: 'absolute',
                  left: `${f.xPct}%`,
                  top: `${f.yPct}%`,
                  transform: 'translate(-2px, -2px)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#E4572E',
                  border: '1px solid #fff',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </div>

          <div style={{ minWidth: 220, flex: 1 }}>
            <h4>Placed fields ({fields.length})</h4>
            {fields.length === 0 && <p className="portal-form__hint">No fields placed yet.</p>}
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: 420, overflowY: 'auto' }}>
              {fields.map((f, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  <span>{f.key}</span>
                  <button type="button" className="btn btn--ghost" onClick={() => removeField(i)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save field positions'}
          </button>
        </div>
      </div>
    </div>
  )
}
