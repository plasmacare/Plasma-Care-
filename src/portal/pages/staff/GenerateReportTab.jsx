import { useEffect, useMemo, useRef, useState } from 'react'
import { listTestPanels } from '../../lib/testPanels'
import { fetchDoctors, renderReportToPdfBlob } from '../../lib/reportBuilder'
import { uploadPdfToCloudinary } from '../../lib/cloudinary'
import LabReportTemplate from '../../components/LabReportTemplate'

const FLAGS = ['', 'H', 'L']

function toDatetimeLocal(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function toDateInput(d) {
  return toDatetimeLocal(d).slice(0, 10)
}
function newRegNo() {
  return String(Date.now()).slice(-6)
}

export default function GenerateReportTab() {
  const [panels, setPanels] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPanel, setSelectedPanel] = useState(null)
  const [rows, setRows] = useState([])

  const now = new Date()
  const [patient, setPatient] = useState({
    name: '', age: '', sex: 'male', refDoctor: '', regNo: newRegNo(),
    registeredOn: toDatetimeLocal(now), receivedOn: toDateInput(now),
  })
  const [doctorId, setDoctorId] = useState('')

  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const templateRef = useRef(null)

  useEffect(() => {
    listTestPanels().then(setPanels).catch((err) => setLoadError(err.message || 'Could not load the test catalog.')).finally(() => setLoading(false))
    fetchDoctors().then(setDoctors).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return panels
    return panels.filter((p) => p.testName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }, [panels, search])

  function pickPanel(panel) {
    setSelectedPanel(panel)
    setRows(panel.parameters.map((p) => ({ key: p.key, name: p.name, unit: p.unit, reference: p.reference, value: '', flag: '' })))
    setResultUrl('')
    setGenError('')
  }

  function updateRow(idx, field, value) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, { key: `extra_${prev.length}`, name: '', unit: '', reference: '', value: '', flag: '' }])
  }
  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  function updatePatient(key, value) {
    setPatient((prev) => ({ ...prev, [key]: value }))
  }

  const selectedDoctor = doctors.find((d) => d.id === doctorId) || null

  async function handleGenerate() {
    if (!selectedPanel) return
    setGenError('')
    setGenerating(true)
    try {
      // Let the off-screen template re-render with the latest field values before capture.
      await new Promise((resolve) => setTimeout(resolve, 150))
      const blob = await renderReportToPdfBlob(templateRef.current)
      const genId = `${selectedPanel.testName.toLowerCase().replace(/\s+/g, '-')}-${patient.regNo}`
      const { url } = await uploadPdfToCloudinary(new File([blob], 'report.pdf', { type: 'application/pdf' }), `plasma-care-reports/generated/${genId}`)
      setResultUrl(url)
    } catch (err) {
      setGenError(err.message || 'Could not generate the report.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleShare() {
    if (!resultUrl) return
    const shareData = { title: `${selectedPanel?.testName || 'Lab'} report — ${patient.name}`.trim(), text: 'Your lab report is ready.', url: resultUrl }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* user cancelled — fine */ }
    } else {
      window.open(resultUrl, '_blank', 'noopener')
    }
  }
  function handleWhatsAppShare() {
    if (!resultUrl) return
    window.open(`https://wa.me/?text=${encodeURIComponent(`Your lab report is ready: ${resultUrl}`)}`, '_blank', 'noopener')
  }
  async function handleCopyLink() {
    if (!resultUrl) return
    try { await navigator.clipboard.writeText(resultUrl) } catch { /* link is still shown below */ }
  }

  if (loading) return <p>Loading test catalog…</p>

  const bookingLike = { patient_name: patient.name, patient_age: patient.age, patient_gender: patient.sex }
  const sections = selectedPanel ? [{ title: selectedPanel.panelHeading || selectedPanel.testName, tests: rows }] : []

  return (
    <div>
      {loadError && <p className="admin-error">{loadError}</p>}

      {!selectedPanel ? (
        <div>
          <h3>1. Choose a test</h3>
          <p className="portal-form__hint">Parameters, units and reference ranges auto-fill from the catalog.</p>
          <input
            placeholder="Search test name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12, width: '100%', maxWidth: 400 }}
          />
          {filtered.length === 0 ? (
            <p className="portal-form__hint">No tests found{search ? ' for that search' : ' — run supabase/test_panels_seed.sql to load the catalog'}.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filtered.map((p) => (
                <li key={p.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => pickPanel(p)}>
                    {p.testName} <span style={{ opacity: 0.6 }}>· {p.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn--ghost" onClick={() => { setSelectedPanel(null); setResultUrl('') }}>
            ← Choose a different test
          </button>
          <h3>{selectedPanel.testName}</h3>

          <h4>2. Patient &amp; test details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
            <label className="report-builder__field">Patient name
              <input value={patient.name} onChange={(e) => updatePatient('name', e.target.value)} />
            </label>
            <label className="report-builder__field">Age
              <input type="number" value={patient.age} onChange={(e) => updatePatient('age', e.target.value)} />
            </label>
            <label className="report-builder__field">Sex
              <select value={patient.sex} onChange={(e) => updatePatient('sex', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="report-builder__field">Referred by
              <input placeholder="Self" value={patient.refDoctor} onChange={(e) => updatePatient('refDoctor', e.target.value)} />
            </label>
            <label className="report-builder__field">Reg no.
              <input value={patient.regNo} onChange={(e) => updatePatient('regNo', e.target.value)} />
            </label>
            <label className="report-builder__field">Registered on
              <input type="datetime-local" value={patient.registeredOn} onChange={(e) => updatePatient('registeredOn', e.target.value)} />
            </label>
            <label className="report-builder__field">Received on
              <input type="date" value={patient.receivedOn} onChange={(e) => updatePatient('receivedOn', e.target.value)} />
            </label>
            <label className="report-builder__field">Sign-off doctor (optional)
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">None</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.qualification}</option>
                ))}
              </select>
            </label>
          </div>

          <h4>3. Results</h4>
          <table className="admin-table" style={{ marginBottom: 12 }}>
            <thead>
              <tr><th>Parameter</th><th>Flag</th><th>Value</th><th>Unit</th><th>Reference</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input value={r.name} onChange={(e) => updateRow(i, 'name', e.target.value)} style={{ minWidth: 160 }} /></td>
                  <td>
                    <select value={r.flag} onChange={(e) => updateRow(i, 'flag', e.target.value)}>
                      {FLAGS.map((f) => <option key={f} value={f}>{f || '—'}</option>)}
                    </select>
                  </td>
                  <td><input value={r.value} onChange={(e) => updateRow(i, 'value', e.target.value)} style={{ width: 90 }} /></td>
                  <td><input value={r.unit} onChange={(e) => updateRow(i, 'unit', e.target.value)} style={{ width: 90 }} /></td>
                  <td><input value={r.reference} onChange={(e) => updateRow(i, 'reference', e.target.value)} style={{ minWidth: 120 }} /></td>
                  <td><button type="button" className="btn btn--ghost" onClick={() => removeRow(i)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn btn--ghost" onClick={addRow} style={{ marginBottom: 16 }}>+ Add parameter</button>

          {genError && <p className="admin-error">{genError}</p>}
          <button type="button" className="btn btn--primary" disabled={generating || rows.length === 0} onClick={handleGenerate}>
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

          {/* Rendered off-screen purely so html2canvas has a real DOM node to capture. */}
          <div style={{ position: 'fixed', left: -9999, top: 0 }}>
            <div ref={templateRef}>
              <LabReportTemplate
                booking={bookingLike}
                doctor={selectedDoctor}
                regNo={patient.regNo}
                registeredOn={patient.registeredOn}
                receivedOn={patient.receivedOn}
                refDoctor={patient.refDoctor}
                sections={sections}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
