import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPackages, fetchTests } from '../../lib/catalogData'
import { submitBulkRequest } from '../../lib/b2bData'
import { logEvent } from '../../../lib/telemetry'
import { usePortalAuth } from '../../lib/portalAuth.jsx'

const GENDERS = ['Male', 'Female', 'Other']

export default function B2BBulkAdd() {
  const { b2bAccount } = usePortalAuth()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])
  const [preferredDate, setPreferredDate] = useState('')
  const [patients, setPatients] = useState([]) // [{ id, name, age, gender, phone, optionKey }]
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  // Draft row for the add-patient boxes
  const [draft, setDraft] = useState({ name: '', age: '', gender: '', phone: '' })
  const nameInputRef = useRef(null)

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchTests().then(setTests).catch(() => {})
  }, [])

  // One combined list so a single dropdown can offer both packages and
  // individual tests, tagged so we know which table an id belongs to.
  const options = useMemo(
    () => [
      ...packages.map((p) => ({ key: `pkg:${p.id}`, id: p.id, kind: 'package', label: `${p.name} — ₹${p.price}` })),
      ...tests.map((t) => ({ key: `test:${t.id}`, id: t.id, kind: 'test', label: `${t.name} — ₹${t.price}` })),
    ],
    [packages, tests],
  )

  function findOptionByName(name) {
    if (!name) return null
    const needle = name.trim().toLowerCase()
    return options.find((o) => o.label.toLowerCase().startsWith(needle)) || null
  }

  // Auto-add: the moment all four fields are filled, the row commits to
  // the list on its own and the boxes clear for the next person — no
  // separate "Add" click needed.
  useEffect(() => {
    const { name, age, gender, phone } = draft
    if (name.trim() && age.trim() && gender && phone.trim().length >= 7) {
      setPatients((prev) => [...prev, { id: crypto.randomUUID(), name: name.trim(), age: age.trim(), gender, phone: phone.trim(), optionKey: '' }])
      setDraft({ name: '', age: '', gender: '', phone: '' })
      nameInputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  function removePatient(id) {
    setPatients((prev) => prev.filter((p) => p.id !== id))
  }

  function setPatientOption(id, optionKey) {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, optionKey } : p)))
  }

  function handleCsvFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(',').map((c) => c.trim()))
        // Skip a header row if the first cell looks like a label, not a name.
        .filter((cols, i) => !(i === 0 && /^name$/i.test(cols[0] || '')))

      const imported = rows
        .filter((cols) => cols[0])
        .map((cols) => {
          const [name, age, gender, phone, testName] = cols
          const matched = findOptionByName(testName)
          return {
            id: crypto.randomUUID(),
            name: name || '',
            age: age || '',
            gender: gender || '',
            phone: phone || '',
            optionKey: matched?.key || '',
          }
        })

      setPatients((prev) => [...prev, ...imported])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (patients.length === 0) {
      setError('Add at least one patient below.')
      return
    }
    const missingTest = patients.find((p) => !p.optionKey)
    if (missingTest) {
      setError(`Select a test/package for ${missingTest.name} before submitting.`)
      return
    }

    setSubmitting(true)
    try {
      const patientPayload = patients.map((p) => {
        const opt = options.find((o) => o.key === p.optionKey)
        return {
          name: p.name,
          age: p.age,
          gender: p.gender,
          phone: p.phone,
          package_id: opt?.kind === 'package' ? opt.id : null,
          individual_test_id: opt?.kind === 'test' ? opt.id : null,
          test_label: opt?.label.replace(/ — ₹.*/, '') || '',
        }
      })

      await submitBulkRequest({
        b2bAccountId: b2bAccount.id,
        preferredDate,
        patients: patientPayload,
        notes,
      })
      logEvent({ type: 'b2b_bulk_request_submitted', source: 'b2b', message: `Bulk request: ${patients.length} patients`, metadata: { patient_count: patients.length } })
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

      <div className="b2b-add-box">
        <p className="portal-form__hint" style={{ marginBottom: 8 }}>
          Fill a patient's details — they're added to the list automatically once all four are filled in.
        </p>
        <div className="b2b-add-box__row">
          <input
            ref={nameInputRef}
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            placeholder="Age"
            inputMode="numeric"
            value={draft.age}
            onChange={(e) => setDraft({ ...draft, age: e.target.value })}
          />
          <select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
            <option value="">Gender</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input
            placeholder="Phone"
            inputMode="tel"
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          />
        </div>

        <div className="b2b-add-box__upload">
          <span>or upload a list:</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFile}
          />
          <span className="portal-form__hint">
            CSV columns: Name, Age, Gender, Phone, Test/Package (optional). Export your Excel sheet as CSV first.
          </span>
        </div>
      </div>

      {patients.length > 0 && (
        <div className="b2b-table-wrap" style={{ marginTop: 16 }}>
          <table className="b2b-table">
            <thead>
              <tr>
                <th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Test / Package</th><th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.gender}</td>
                  <td>{p.phone}</td>
                  <td>
                    <select value={p.optionKey} onChange={(e) => setPatientOption(p.id, e.target.value)}>
                      <option value="">— Select —</option>
                      {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="btn btn--ghost" onClick={() => removePatient(p.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit} className="portal-form" style={{ marginTop: 20 }}>
        <label>Preferred date (optional)</label>
        <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />

        <label>Notes for staff (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Submitting…' : `Submit batch (${patients.length} patients)`}
        </button>
      </form>
    </div>
  )
}
