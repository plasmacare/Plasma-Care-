import { useEffect, useMemo, useState } from 'react'
import {
  listTemplates, renderTemplateToPdfBlob, uploadGeneratedReportPdf, splitTemplateFields, labelFromKey,
} from '../../lib/reportTemplates'

function todayDisplay() {
  return new Date().toLocaleDateString('en-GB')
}

function newRegNo() {
  return `PC${Date.now().toString().slice(-8)}`
}

export default function GenerateReportTab() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const [patientValues, setPatientValues] = useState({
    patientName: '', ageSex: '', age: '', sex: '', refDoctor: '', regNo: newRegNo(), registeredOn: '', collectedOn: '', reportedOn: todayDisplay(),
  })
  const [resultValues, setResultValues] = useState({})

  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [resultUrl, setResultUrl] = useState('')

  useEffect(() => {
    listTemplates()
      .then((all) => setTemplates(all.filter((t) => (t.fields || []).length > 0)))
      .catch((err) => setLoadError(err.message || 'Could not load report formats.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.testName.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
  }, [templates, search])

  const selected = templates.find((t) => t.id === selectedId) || null
  const { patientFields, resultFields } = selected ? splitTemplateFields(selected) : { patientFields: [], resultFields: [] }

  function pickTest(t) {
    setSelectedId(t.id)
    setResultValues({})
    setResultUrl('')
    setGenError('')
    setPatientValues((prev) => ({ ...prev, regNo: prev.regNo || newRegNo() }))
  }

  function updatePatient(key, value) {
    setPatientValues((prev) => ({ ...prev, [key]: value }))
  }

  function updateResult(key, value) {
    setResultValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleGenerate() {
    if (!selected) return
    setGenerating(true)
    setGenError('')
    setResultUrl('')
    try {
      const values = { ...patientValues, ...resultValues }
      const blob = await renderTemplateToPdfBlob(selected, values)
      const genId = `${selected.testName.toLowerCase().replace(/\s+/g, '-')}-${patientValues.regNo || Date.now()}`
      const url = await uploadGeneratedReportPdf(genId, blob)
      setResultUrl(url)
    } catch (err) {
      setGenError(err.message || 'Could not generate the report.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleShare() {
    if (!resultUrl) return
    const shareData = {
      title: `${selected?.testName || 'Lab'} report — ${patientValues.patientName || ''}`.trim(),
      text: 'Your lab report is ready.',
      url: resultUrl,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* user cancelled — fine */ }
    } else {
      window.open(resultUrl, '_blank', 'noopener')
    }
  }

  function handleWhatsAppShare() {
    if (!resultUrl) return
    const text = encodeURIComponent(`Your lab report is ready: ${resultUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener')
  }

  async function handleCopyLink() {
    if (!resultUrl) return
    try {
      await navigator.clipboard.writeText(resultUrl)
    } catch { /* clipboard may be unavailable — the link is still shown below */ }
  }

  if (loading) return <p>Loading formats…</p>

  return (
    <div>
      {loadError && <p className="admin-error">{loadError}</p>}

      {!selected ? (
        <div>
          <h3>1. Choose a test</h3>
          <p className="portal-form__hint">
            Only formats that already have their fields mapped show up here. Map a format's fields first
            under "Manage Formats" if the test you need isn't listed.
          </p>
          <input
            placeholder="Search test name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12, width: '100%', maxWidth: 400 }}
          />
          {filtered.length === 0 ? (
            <p className="portal-form__hint">No mapped formats found{search ? ' for that search' : ''}.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filtered.map((t) => (
                <li key={t.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => pickTest(t)}>
                    {t.testName} <span style={{ opacity: 0.6 }}>· {t.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn--ghost" onClick={() => { setSelectedId(''); setResultUrl('') }}>
            ← Choose a different test
          </button>
          <h3>{selected.testName}</h3>

          <h4>2. Patient &amp; test details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
            {(patientFields.length ? patientFields.map((f) => ({ key: f.key, label: labelFromKey(f.key) })) : [
              { key: 'patientName', label: 'Patient name' },
              { key: 'ageSex', label: 'Age / Sex' },
              { key: 'refDoctor', label: 'Referring doctor' },
              { key: 'regNo', label: 'Reg / Sample No.' },
              { key: 'registeredOn', label: 'Registered on' },
              { key: 'collectedOn', label: 'Sample collected on' },
              { key: 'reportedOn', label: 'Reported on' },
            ]).map((f) => (
              <label key={f.key} className="report-builder__field">
                {f.label}
                <input value={patientValues[f.key] || ''} onChange={(e) => updatePatient(f.key, e.target.value)} />
              </label>
            ))}
          </div>

          <h4>3. Result{resultFields.length !== 1 ? 's' : ''}</h4>
          {resultFields.length === 0 ? (
            <p className="portal-form__hint">
              This format has no result-value fields mapped yet — go to "Manage Formats" → Map fields
              to add them.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
              {resultFields.map((f) => (
                <label key={f.key} className="report-builder__field">
                  {labelFromKey(f.key)}
                  <input value={resultValues[f.key] || ''} onChange={(e) => updateResult(f.key, e.target.value)} />
                </label>
              ))}
            </div>
          )}

          {genError && <p className="admin-error">{genError}</p>}
          <button type="button" className="btn btn--primary" disabled={generating} onClick={handleGenerate}>
            {generating ? 'Generating…' : 'Generate report'}
          </button>

          {resultUrl && (
            <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
              <p><strong>Report ready.</strong> <a href={resultUrl} target="_blank" rel="noreferrer">Open / preview</a></p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn--primary" onClick={handleShare}>Share</button>
                <button type="button" className="btn btn--secondary" onClick={handleWhatsAppShare}>Share on WhatsApp</button>
                <button type="button" className="btn btn--ghost" onClick={handleCopyLink}>Copy link</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
