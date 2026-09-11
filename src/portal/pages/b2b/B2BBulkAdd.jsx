import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPackages, fetchTests } from '../../lib/catalogData'
import { submitRegistration } from '../../lib/b2bData'
import { logEvent } from '../../../lib/telemetry'
import { usePortalAuth } from '../../lib/portalAuth.jsx'
import TestPackageSearchSelect from '../../components/TestPackageSearchSelect'

const GENDERS = ['Male', 'Female', 'Other']

export default function B2BBulkAdd() {
  const { b2bAccount } = usePortalAuth()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')

  const [selectedTests, setSelectedTests] = useState([]) // [{ id, optionKey, time }]
  const [testDraftKey, setTestDraftKey] = useState('')
  const [testDraftTime, setTestDraftTime] = useState('')

  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  function addTest() {
    if (!testDraftKey || !testDraftTime) return
    setSelectedTests((prev) => [...prev, { id: crypto.randomUUID(), optionKey: testDraftKey, time: testDraftTime }])
    setTestDraftKey('')
    setTestDraftTime('')
  }

  function removeTest(id) {
    setSelectedTests((prev) => prev.filter((t) => t.id !== id))
  }

  const total = selectedTests.reduce((sum, t) => {
    const opt = options.find((o) => o.key === t.optionKey)
    return sum + (opt?.price || 0)
  }, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !age.trim() || !gender) {
      setError('Fill in name, age and gender.')
      return
    }
    if (selectedTests.length === 0) {
      setError('Add at least one test/package with a collection time.')
      return
    }

    setSubmitting(true)
    try {
      const testsPayload = selectedTests.map((t) => {
        const opt = options.find((o) => o.key === t.optionKey)
        return {
          package_id: opt?.kind === 'package' ? opt.id : null,
          individual_test_id: opt?.kind === 'test' ? opt.id : null,
          test_label: opt?.name || '',
          price: opt?.price || 0,
          time: t.time,
        }
      })

      await submitRegistration({
        b2bAccountId: b2bAccount.id,
        name: name.trim(),
        age: age.trim(),
        gender,
        phone: phone.trim(),
        tests: testsPayload,
        notes,
      })
      logEvent({ type: 'b2b_registration_submitted', source: 'b2b', message: `Registration: ${name}`, metadata: { test_count: testsPayload.length } })
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
        <p className="portal-form__hint" style={{ marginBottom: 8 }}>Patient details</p>
        <div className="b2b-add-box__stack">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Gender</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input placeholder="Phone (optional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="b2b-add-box" style={{ marginTop: 12 }}>
        <p className="portal-form__hint" style={{ marginBottom: 8 }}>
          Choose a test/package and the time its sample was/will be collected — add as many as needed.
        </p>
        <div className="b2b-add-box__stack">
          <TestPackageSearchSelect
            tests={tests}
            packages={packages}
            value={options.find((o) => o.key === testDraftKey)?.name || ''}
            onSelect={(o) => setTestDraftKey(o.key)}
            placeholder="Search test/package…"
          />
          <input
            type="time"
            value={testDraftTime}
            onChange={(e) => setTestDraftTime(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          style={{ marginTop: 8 }}
          disabled={!testDraftKey || !testDraftTime}
          onClick={addTest}
        >
          + Add test
        </button>
      </div>

      {selectedTests.length > 0 && (
        <div className="b2b-patient-cards" style={{ marginTop: 16 }}>
          {selectedTests.map((t) => {
            const opt = options.find((o) => o.key === t.optionKey)
            return (
              <div key={t.id} className="b2b-patient-card">
                <div className="b2b-patient-card__row" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  <div><span className="b2b-patient-card__label">Test / Package</span>{opt?.name}</div>
                  <div><span className="b2b-patient-card__label">Collected at</span>{t.time}</div>
                </div>
                {opt && <p className="b2b-patient-card__price">₹{opt.price}</p>}
                <button type="button" className="btn btn--ghost" onClick={() => removeTest(t.id)}>Remove</button>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="portal-form" style={{ marginTop: 20 }}>
        <label>Notes for staff (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {selectedTests.length > 0 && (
          <p className="b2b-total">Final price: <strong>₹{total}</strong></p>
        )}

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>
    </div>
  )
}
