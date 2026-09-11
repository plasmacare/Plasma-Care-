import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPackages, fetchTests } from '../../lib/catalogData'
import { submitBulkRequest } from '../../lib/b2bData'
import { logEvent } from '../../../lib/telemetry'
import { usePortalAuth } from '../../lib/portalAuth.jsx'
import TestPackageSearchSelect from '../../components/TestPackageSearchSelect'

const GENDERS = ['Male', 'Female', 'Other']

export default function B2BBulkAdd() {
  const { b2bAccount } = usePortalAuth()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])
  const [preferredTime, setPreferredTime] = useState('')
  const [patients, setPatients] = useState([]) // [{ id, name, age, gender, phone, optionKey }]
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Draft row for the add-patient boxes — one registration at a time.
  const [draft, setDraft] = useState({ name: '', age: '', gender: '', phone: '' })
  const nameInputRef = useRef(null)

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchTests().then(setTests).catch(() => {})
  }, [])

  // One combined list so a single search box can offer both packages
  // and individual tests, tagged so we know which table an id belongs to.
  const options = useMemo(
    () => [
      ...packages.map((p) => ({ key: `pkg:${p.id}`, id: p.id, kind: 'package', name: p.name, price: p.price })),
      ...tests.map((t) => ({ key: `test:${t.id}`, id: t.id, kind: 'test', name: t.name, price: t.price })),
    ],
    [packages, tests],
  )

  // Auto-add: fires once name/age/gender are filled AND phone is either
  // left empty (phone is optional) or a full, valid number — never on a
  // partial phone number mid-typing. There's also an explicit button
  // below for anyone who prefers not to rely on the auto-trigger.
  useEffect(() => {
    const { name, age, gender, phone } = draft
    const phoneDigits = phone.trim().replace(/\D/g, '')
    const phoneOkOrEmpty = phoneDigits.length === 0 || phoneDigits.length === 10
    if (name.trim() && age.trim() && gender && phoneOkOrEmpty && phoneDigits.length === 10) {
      commitDraft()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  function commitDraft() {
    const { name, age, gender, phone } = draft
    if (!name.trim() || !age.trim() || !gender) return
    setPatients((prev) => [...prev, { id: crypto.randomUUID(), name: name.trim(), age: age.trim(), gender, phone: phone.trim(), optionKey: '' }])
    setDraft({ name: '', age: '', gender: '', phone: '' })
    nameInputRef.current?.focus()
  }

  function removePatient(id) {
    setPatients((prev) => prev.filter((p) => p.id !== id))
  }

  function setPatientOption(id, optionKey) {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, optionKey } : p)))
  }

  const total = patients.reduce((sum, p) => {
    const opt = options.find((o) => o.key === p.optionKey)
    return sum + (opt?.price || 0)
  }, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (patients.length === 0) {
      setError('Add at least one registration below.')
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
          test_label: opt?.name || '',
        }
      })

      await submitBulkRequest({
        b2bAccountId: b2bAccount.id,
        preferredTime,
        patients: patientPayload,
        notes,
      })
      logEvent({ type: 'b2b_bulk_request_submitted', source: 'b2b', message: `Registration: ${patients.length} patient(s)`, metadata: { patient_count: patients.length } })
      navigate('/portal/b2b/history')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 16 }}>Add Registration</h2>

      <div className="b2b-add-box">
        <p className="portal-form__hint" style={{ marginBottom: 8 }}>
          Add patients one at a time — fill their details below and they're added to the list once all filled in.
        </p>
        <div className="b2b-add-box__stack">
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
            placeholder="Phone (optional)"
            inputMode="tel"
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          />
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          style={{ marginTop: 8 }}
          disabled={!draft.name.trim() || !draft.age.trim() || !draft.gender}
          onClick={commitDraft}
        >
          + Add patient
        </button>
      </div>

      {patients.length > 0 && (
        <div className="b2b-patient-cards">
          {patients.map((p) => {
            const opt = options.find((o) => o.key === p.optionKey)
            return (
              <div key={p.id} className="b2b-patient-card">
                <div className="b2b-patient-card__row">
                  <div><span className="b2b-patient-card__label">Name</span>{p.name}</div>
                  <div><span className="b2b-patient-card__label">Age</span>{p.age}</div>
                  <div><span className="b2b-patient-card__label">Gender</span>{p.gender}</div>
                  <div><span className="b2b-patient-card__label">Phone</span>{p.phone || '—'}</div>
                </div>
                <TestPackageSearchSelect
                  tests={tests}
                  packages={packages}
                  value={opt?.name || ''}
                  onSelect={(o) => setPatientOption(p.id, o.key)}
                  placeholder="Search test/package…"
                />
                {opt && <p className="b2b-patient-card__price">₹{opt.price}</p>}
                <button type="button" className="btn btn--ghost" onClick={() => removePatient(p.id)}>Remove</button>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="portal-form" style={{ marginTop: 20 }}>
        <label>Usual sample collection time (optional)</label>
        <input
          type="text"
          placeholder="e.g. samples are usually collected around 10 AM at our location"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
        />
        <p className="portal-form__hint">Helps our team plan the visit — not a fixed slot, we'll still call to confirm.</p>

        <label>Notes for staff (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {patients.length > 0 && (
          <p className="b2b-total">Total: <strong>₹{total}</strong> for {patients.length} patient(s)</p>
        )}

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Submitting…' : `Submit registration (${patients.length} patient${patients.length === 1 ? '' : 's'})`}
        </button>
      </form>
    </div>
  )
}
