import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPackages, fetchTests } from '../../lib/catalogData'
import { submitBulkRequest } from '../../lib/b2bData'
import { logEvent } from '../../../lib/telemetry'
import { usePortalAuth } from '../../lib/portalAuth.jsx'

const SAMPLE = 'Rahul Sharma, 34, Male, 9876543210\nPriya Verma, 28, Female, 9123456780'

export default function B2BBulkAdd() {
  const { b2bAccount } = usePortalAuth()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])
  const [selectionType, setSelectionType] = useState('package') // 'package' | 'test'
  const [selectedId, setSelectedId] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [rawText, setRawText] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchTests().then(setTests).catch(() => {})
  }, [])

  // "Name, Age, Gender, Phone" per line — simple and copy-pasteable from
  // Excel/Sheets without needing a CSV file upload.
  function parsePatients() {
    return rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, age, gender, phone] = line.split(',').map((p) => p?.trim())
        return { name: name || '', age: age || '', gender: gender || '', phone: phone || '' }
      })
      .filter((p) => p.name)
  }

  const preview = parsePatients()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (preview.length === 0) {
      setError('Add at least one patient (Name, Age, Gender, Phone).')
      return
    }
    if (!selectedId) {
      setError('Select a package or test.')
      return
    }
    setSubmitting(true)
    try {
      await submitBulkRequest({
        b2bAccountId: b2bAccount.id,
        packageId: selectionType === 'package' ? selectedId : null,
        individualTestId: selectionType === 'test' ? selectedId : null,
        preferredDate,
        patients: preview,
        notes,
      })
      logEvent({ type: 'b2b_bulk_request_submitted', source: 'b2b', message: `Bulk request: ${preview.length} patients`, metadata: { patient_count: preview.length } })
      navigate('/portal/b2b/history')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 16 }}>Bulk Add Patients</h2>

      <form onSubmit={handleSubmit} className="portal-form">
        <label>Select a test or package</label>
        <select value={selectionType} onChange={(e) => { setSelectionType(e.target.value); setSelectedId('') }}>
          <option value="package">Package</option>
          <option value="test">Individual Test</option>
        </select>

        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required>
          <option value="">— Select —</option>
          {(selectionType === 'package' ? packages : tests).map((item) => (
            <option key={item.id} value={item.id}>{item.name} — ₹{item.price}</option>
          ))}
        </select>

        <label>Preferred date (optional)</label>
        <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />

        <label>Patients — one per line: Name, Age, Gender, Phone</label>
        <textarea
          rows={8}
          placeholder={SAMPLE}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <p className="portal-form__hint">{preview.length} patient(s) detected</p>

        {preview.length > 0 && (
          <div className="b2b-table-wrap" style={{ marginTop: 8 }}>
            <table className="b2b-table">
              <thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th></tr></thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i}><td>{p.name}</td><td>{p.age}</td><td>{p.gender}</td><td>{p.phone}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <label>Notes for staff (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Submitting…' : `Submit batch (${preview.length} patients)`}
        </button>
      </form>
    </div>
  )
}
