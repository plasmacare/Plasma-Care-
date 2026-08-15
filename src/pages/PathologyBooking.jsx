import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepTracker from '../components/StepTracker'
import LocationPicker from '../components/LocationPicker'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../lib/i18n.jsx'
import { fetchPackages, fetchTests, createBooking, savePatientDetails, uploadPrescription } from '../lib/booking'
import './PathologyBooking.css'

const STEP = { TESTS: 0, TYPE: 1, LOCATION: 2, SCHEDULE: 3, DETAILS: 4, PATIENT: 5, DONE: 6 }

// Formats a Date as YYYY-MM-DD using LOCAL date parts, not UTC — using
// toISOString() here would shift the date back a day for anyone booking
// between 12:00 AM and 5:30 AM IST, since IST is UTC+5:30.
function formatLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function nextDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

export default function PathologyBooking() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [step, setStep] = useState(STEP.TESTS)
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])
  const [selectedPackages, setSelectedPackages] = useState([])
  const [selectedTests, setSelectedTests] = useState([])
  const [bookingType, setBookingType] = useState(null)
  const [location, setLocation] = useState(null)
  const [date, setDate] = useState(null)
  const [prescriptionFile, setPrescriptionFile] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [bookingId, setBookingId] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [patientBloodGroup, setPatientBloodGroup] = useState('')

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchTests().then(setTests).catch(() => {})
  }, [])

  const total = useMemo(() => {
    const pkgSum = packages.filter((p) => selectedPackages.includes(p.id)).reduce((s, p) => s + Number(p.price), 0)
    const testSum = tests.filter((t) => selectedTests.includes(t.id)).reduce((s, t) => s + Number(t.price), 0)
    return pkgSum + testSum
  }, [packages, tests, selectedPackages, selectedTests])

  const itemCount = selectedPackages.length + selectedTests.length
  const canProceedFromTests = itemCount > 0 || !!prescriptionFile

  const stepLabels = bookingType === 'lab_visit'
    ? [t('step_tests'), t('step_type'), t('step_date'), t('step_details')]
    : [t('step_tests'), t('step_type'), t('step_location'), t('step_date'), t('step_details')]

  const visualStep = bookingType === 'lab_visit' && step >= STEP.LOCATION ? step - 1 : step

  function togglePackage(id) {
    setSelectedPackages((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }
  function toggleTest(id) {
    setSelectedTests((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function goNextFromType() {
    if (bookingType === 'home_collection') setStep(STEP.LOCATION)
    else setStep(STEP.SCHEDULE)
  }

  async function submitDetails() {
    setFormError('')
    if (!name.trim() || phone.trim().length < 10) {
      setFormError('Please enter your name and a 10-digit phone number.')
      return
    }
    setBusy(true)
    try {
      const booking = await createBooking({
        customerName: name,
        customerPhone: phone,
        bookingType,
        selectedPackages,
        selectedTests,
        totalAmount: total,
        scheduledDate: formatLocalDate(date),
        address: location,
      })
      if (prescriptionFile) {
        try {
          await uploadPrescription(booking.id, prescriptionFile)
        } catch {
          // Booking is already created — a failed prescription upload
          // shouldn't block the customer from finishing.
        }
      }
      setBookingId(booking.id)
      setPatientName(name)
      setStep(STEP.PATIENT)
    } catch (e) {
      setFormError('Could not create your booking. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submitPatientDetails() {
    setBusy(true)
    try {
      await savePatientDetails(bookingId, {
        name: patientName,
        age: patientAge,
        gender: patientGender,
        bloodGroup: patientBloodGroup,
      })
    } catch {
      // Booking already exists and is confirmed — don't block the
      // confirmation screen over this being saved.
    } finally {
      setBusy(false)
      setStep(STEP.DONE)
    }
  }

  if (step === STEP.DONE) {
    return <ConfirmationScreen bookingId={bookingId} onHome={() => navigate('/')} t={t} />
  }

  return (
    <div className="page">
      <div className="page-header">
        {step !== STEP.PATIENT && (
          <button className="page-header__back" onClick={() => (step === 0 ? navigate('/') : setStep(step - (bookingType === 'lab_visit' && step === STEP.SCHEDULE ? 2 : 1)))}>
            <BackIcon />
          </button>
        )}
        {step === STEP.PATIENT && <div className="page-header__spacer" />}
        <h1>{t('bookingTitle')}</h1>
        <div className="page-header__spacer" />
        <LanguageSwitcher />
      </div>

      <StepTracker steps={stepLabels} currentStep={visualStep} />

      {step === STEP.TESTS && (
        <TestSelectionStep
          packages={packages}
          tests={tests}
          selectedPackages={selectedPackages}
          selectedTests={selectedTests}
          togglePackage={togglePackage}
          toggleTest={toggleTest}
          prescriptionFile={prescriptionFile}
          setPrescriptionFile={setPrescriptionFile}
          t={t}
        />
      )}

      {step === STEP.TYPE && (
        <TypeStep bookingType={bookingType} setBookingType={setBookingType} t={t} />
      )}

      {step === STEP.LOCATION && (
        <LocationPicker onConfirm={(loc) => { setLocation(loc); setStep(STEP.SCHEDULE) }} />
      )}

      {step === STEP.SCHEDULE && (
        <ScheduleStep date={date} setDate={setDate} t={t} />
      )}

      {step === STEP.DETAILS && (
        <DetailsStep
          name={name} setName={setName}
          phone={phone} setPhone={setPhone}
          error={formError}
          t={t}
        />
      )}

      {step === STEP.PATIENT && (
        <PatientDetailsStep
          name={patientName} setName={setPatientName}
          age={patientAge} setAge={setPatientAge}
          gender={patientGender} setGender={setPatientGender}
          bloodGroup={patientBloodGroup} setBloodGroup={setPatientBloodGroup}
          t={t}
        />
      )}

      {step !== STEP.LOCATION && step !== STEP.PATIENT && (
        <div className="sticky-footer">
          <div className="sticky-footer__summary">
            <div className="sticky-footer__amount">₹{total || 0}</div>
            <div className="sticky-footer__label">{itemCount} {itemCount !== 1 ? t('itemsSelected') : t('itemSelected')}</div>
          </div>
          <FooterButton
            step={step}
            itemCount={itemCount}
            canProceedFromTests={canProceedFromTests}
            bookingType={bookingType}
            date={date}
            busy={busy}
            onTests={() => setStep(STEP.TYPE)}
            onType={goNextFromType}
            onSchedule={() => setStep(STEP.DETAILS)}
            onDetails={submitDetails}
            t={t}
          />
        </div>
      )}

      {step === STEP.PATIENT && (
        <div className="sticky-footer">
          <button className="btn btn--ghost" disabled={busy} onClick={() => setStep(STEP.DONE)}>
            {t('skipForNow')}
          </button>
          <button className="btn btn--primary" disabled={busy || !patientName.trim()} onClick={submitPatientDetails}>
            {busy ? t('saving') : t('saveContinue')}
          </button>
        </div>
      )}
    </div>
  )
}

function FooterButton({ step, itemCount, canProceedFromTests, bookingType, date, busy, onTests, onType, onSchedule, onDetails, t }) {
  if (step === STEP.TESTS) {
    return <button className="btn btn--primary" disabled={!canProceedFromTests} onClick={onTests}>{t('continue')}</button>
  }
  if (step === STEP.TYPE) {
    return <button className="btn btn--primary" disabled={!bookingType} onClick={onType}>{t('continue')}</button>
  }
  if (step === STEP.SCHEDULE) {
    return <button className="btn btn--primary" disabled={!date} onClick={onSchedule}>{t('continue')}</button>
  }
  if (step === STEP.DETAILS) {
    return (
      <button className="btn btn--primary" disabled={busy} onClick={onDetails}>
        {busy ? t('sending') : t('confirmBooking')}
      </button>
    )
  }
  return null
}

function TestSelectionStep({ packages, tests, selectedPackages, selectedTests, togglePackage, toggleTest, prescriptionFile, setPrescriptionFile, t }) {
  return (
    <div className="tests-step">
      <h2 className="section-title">{t('packages')}</h2>
      <div className="item-list">
        {packages.map((p) => (
          <label key={p.id} className={`item-row ${selectedPackages.includes(p.id) ? 'is-selected' : ''}`}>
            <input type="checkbox" checked={selectedPackages.includes(p.id)} onChange={() => togglePackage(p.id)} />
            <div className="item-row__info">
              <span className="item-row__name">{p.name}</span>
              <span className="item-row__desc">{p.description}</span>
            </div>
            <span className="item-row__price">₹{p.price}</span>
          </label>
        ))}
      </div>

      <h2 className="section-title">{t('individualTests')}</h2>
      <div className="item-list">
        {tests.map((tItem) => (
          <label key={tItem.id} className={`item-row ${selectedTests.includes(tItem.id) ? 'is-selected' : ''}`}>
            <input type="checkbox" checked={selectedTests.includes(tItem.id)} onChange={() => toggleTest(tItem.id)} />
            <div className="item-row__info">
              <span className="item-row__name">{tItem.name}</span>
              <span className="item-row__desc">{tItem.category}</span>
            </div>
            <span className="item-row__price">₹{tItem.price}</span>
          </label>
        ))}
      </div>

      <PrescriptionUpload file={prescriptionFile} setFile={setPrescriptionFile} t={t} />
    </div>
  )
}

function PrescriptionUpload({ file, setFile, t }) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  return (
    <div className="prescription-upload">
      <div className="prescription-upload__divider"><span>{t('or')}</span></div>
      <h2 className="section-title">{t('prescriptionTitle')}</h2>
      <p className="prescription-upload__note">{t('prescriptionNote')}</p>

      {file ? (
        <div className="prescription-upload__preview">
          <img src={previewUrl} alt="Prescription" />
          <button type="button" className="btn btn--ghost" onClick={() => setFile(null)}>{t('removePhoto')}</button>
        </div>
      ) : (
        <label className="btn btn--secondary btn--block prescription-upload__btn">
          {t('uploadPrescription')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  )
}

function TypeStep({ bookingType, setBookingType, t }) {
  return (
    <div className="type-step">
      <button
        className={`type-card ${bookingType === 'home_collection' ? 'is-selected' : ''}`}
        onClick={() => setBookingType('home_collection')}
      >
        <HomeIcon />
        <div>
          <h3>{t('homeCollection')}</h3>
          <p>{t('homeCollectionDesc')}</p>
        </div>
      </button>
      <button
        className={`type-card ${bookingType === 'lab_visit' ? 'is-selected' : ''}`}
        onClick={() => setBookingType('lab_visit')}
      >
        <LabIcon />
        <div>
          <h3>{t('visitLab')}</h3>
          <p>{t('visitLabDesc')}</p>
        </div>
      </button>
    </div>
  )
}

function ScheduleStep({ date, setDate, t }) {
  const days = nextDays(14)
  return (
    <div className="schedule-step">
      <h2 className="section-title">{t('pickDate')}</h2>
      <div className="day-chips">
        {days.map((d) => {
          const isSelected = date && d.toDateString() === date.toDateString()
          return (
            <button key={d.toISOString()} className={`day-chip ${isSelected ? 'is-selected' : ''}`} onClick={() => setDate(d)}>
              <span className="day-chip__dow">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              <span className="day-chip__date">{d.getDate()}</span>
            </button>
          )
        })}
      </div>
      {date && <p className="schedule-step__hours-note">{t('storeHoursNote')}</p>}
    </div>
  )
}

function DetailsStep({ name, setName, phone, setPhone, error, t }) {
  return (
    <div className="details-step">
      <div className="field">
        <label>{t('fullName')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('fullNamePlaceholder')} />
      </div>
      <div className="field">
        <label>{t('phoneNumber')}</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder={t('phonePlaceholder')} />
      </div>
      <p className="details-step__note">{t('contactNote')}</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']

function PatientDetailsStep({ name, setName, age, setAge, gender, setGender, bloodGroup, setBloodGroup, t }) {
  return (
    <div className="details-step">
      <h2 className="section-title">{t('patientDetailsTitle')}</h2>
      <p className="details-step__note">{t('patientDetailsNote')}</p>
      <div className="field">
        <label>{t('patientName')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('fullNamePlaceholder')} />
      </div>
      <div className="field">
        <label>{t('patientAge')}</label>
        <input
          type="number"
          min="0"
          max="120"
          value={age}
          onChange={(e) => setAge(e.target.value.slice(0, 3))}
          placeholder={t('patientAgePlaceholder')}
        />
      </div>
      <div className="field">
        <label>{t('patientGender')}</label>
        <div className="pill-group">
          {['male', 'female', 'other'].map((g) => (
            <button
              key={g}
              type="button"
              className={`pill ${gender === g ? 'is-selected' : ''}`}
              onClick={() => setGender(g)}
            >
              {t(`gender_${g}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>{t('patientBloodGroup')}</label>
        <div className="pill-group">
          {BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              type="button"
              className={`pill ${bloodGroup === bg ? 'is-selected' : ''}`}
              onClick={() => setBloodGroup(bg)}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfirmationScreen({ bookingId, onHome, t }) {
  return (
    <div className="page confirmation-screen">
      <div className="confirmation-screen__icon"><CheckIcon /></div>
      <h1>{t('bookingConfirmed')}</h1>
      <p className="confirmation-screen__id">{t('bookingId')}: {bookingId?.slice(0, 8).toUpperCase()}</p>
      <p className="confirmation-screen__hours">{t('storeHoursNote')}</p>
      <p className="confirmation-screen__note">{t('confirmationNote')} 8112060205</p>
      <button className="btn btn--primary" onClick={onHome}>{t('backToHome')}</button>
    </div>
  )
}

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
}
function HomeIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="1.8"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
}
function LabIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="1.8"><path d="M9 2h6M10 3v12a2 2 0 004 0V3" /></svg>
}
function CheckIcon() {
  return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
}
