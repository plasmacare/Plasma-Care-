import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepTracker from '../components/StepTracker'
import LocationPicker from '../components/LocationPicker'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../lib/i18n.jsx'
import { fetchPackages, fetchTests, fetchTimeSlots, createBooking, markBookingVerified } from '../lib/booking'
import { sendOtp, verifyOtp } from '../lib/otp'
import './PathologyBooking.css'

const STEP = { TESTS: 0, TYPE: 1, LOCATION: 2, SCHEDULE: 3, DETAILS: 4, VERIFY: 5, DONE: 6 }

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
  const [slots, setSlots] = useState([])
  const [slotId, setSlotId] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otpChannel, setOtpChannel] = useState('whatsapp')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [busy, setBusy] = useState(false)
  const [bookingId, setBookingId] = useState(null)

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchTests().then(setTests).catch(() => {})
  }, [])

  useEffect(() => {
    if (date) {
      const iso = date.toISOString().slice(0, 10)
      fetchTimeSlots(iso).then(setSlots).catch(() => setSlots([]))
      setSlotId(null)
    }
  }, [date])

  const total = useMemo(() => {
    const pkgSum = packages.filter((p) => selectedPackages.includes(p.id)).reduce((s, p) => s + Number(p.price), 0)
    const testSum = tests.filter((t) => selectedTests.includes(t.id)).reduce((s, t) => s + Number(t.price), 0)
    return pkgSum + testSum
  }, [packages, tests, selectedPackages, selectedTests])

  const itemCount = selectedPackages.length + selectedTests.length

  const stepLabels = bookingType === 'lab_visit'
    ? [t('step_tests'), t('step_type'), t('step_slot'), t('step_details'), t('step_verify')]
    : [t('step_tests'), t('step_type'), t('step_location'), t('step_slot'), t('step_details'), t('step_verify')]

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

  async function requestOtp() {
    setOtpError('')
    if (!name.trim() || phone.trim().length < 10) {
      setOtpError('Naam aur 10-digit phone number bharein.')
      return
    }
    setBusy(true)
    try {
      await sendOtp(phone, otpChannel)
      setStep(STEP.VERIFY)
    } catch (e) {
      setOtpError(`OTP bhejne mein dikkat: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function resendOtp(channel) {
    setOtpChannel(channel)
    setBusy(true)
    try {
      await sendOtp(phone, channel)
    } catch {
      setOtpError('Resend fail ho gaya, thodi der mein try karein.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmBooking() {
    setOtpError('')
    if (otpCode.trim().length !== 6) {
      setOtpError('6-digit OTP daalein.')
      return
    }
    setBusy(true)
    try {
      await verifyOtp(phone, otpCode)
      const booking = await createBooking({
        customerName: name,
        customerPhone: phone,
        bookingType,
        selectedPackages,
        selectedTests,
        totalAmount: total,
        scheduledDate: date.toISOString().slice(0, 10),
        slotId,
        address: location,
      })
      await markBookingVerified(booking.id)
      setBookingId(booking.id)
      setStep(STEP.DONE)
    } catch (e) {
      setOtpError('OTP galat hai ya expire ho gaya. Dobara try karein.')
    } finally {
      setBusy(false)
    }
  }

  if (step === STEP.DONE) {
    return <ConfirmationScreen bookingId={bookingId} onHome={() => navigate('/')} t={t} />
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-header__back" onClick={() => (step === 0 ? navigate('/') : setStep(step - (bookingType === 'lab_visit' && step === STEP.SCHEDULE ? 2 : 1)))}>
          <BackIcon />
        </button>
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
        <ScheduleStep date={date} setDate={setDate} slots={slots} slotId={slotId} setSlotId={setSlotId} t={t} />
      )}

      {step === STEP.DETAILS && (
        <DetailsStep
          name={name} setName={setName}
          phone={phone} setPhone={setPhone}
          error={otpError}
          t={t}
        />
      )}

      {step === STEP.VERIFY && (
        <VerifyStep
          phone={phone}
          otpCode={otpCode} setOtpCode={setOtpCode}
          onResend={resendOtp}
          error={otpError}
          t={t}
        />
      )}

      {step !== STEP.LOCATION && (
        <div className="sticky-footer">
          <div className="sticky-footer__summary">
            <div className="sticky-footer__amount">₹{total || 0}</div>
            <div className="sticky-footer__label">{itemCount} {itemCount !== 1 ? t('itemsSelected') : t('itemSelected')}</div>
          </div>
          <FooterButton
            step={step}
            itemCount={itemCount}
            bookingType={bookingType}
            date={date}
            slotId={slotId}
            busy={busy}
            onTests={() => setStep(STEP.TYPE)}
            onType={goNextFromType}
            onSchedule={() => setStep(STEP.DETAILS)}
            onDetails={requestOtp}
            onVerify={confirmBooking}
            t={t}
          />
        </div>
      )}
    </div>
  )
}

function FooterButton({ step, itemCount, bookingType, date, slotId, busy, onTests, onType, onSchedule, onDetails, onVerify, t }) {
  if (step === STEP.TESTS) {
    return <button className="btn btn--primary" disabled={itemCount === 0} onClick={onTests}>{t('continue')}</button>
  }
  if (step === STEP.TYPE) {
    return <button className="btn btn--primary" disabled={!bookingType} onClick={onType}>{t('continue')}</button>
  }
  if (step === STEP.SCHEDULE) {
    return <button className="btn btn--primary" disabled={!date || !slotId} onClick={onSchedule}>{t('continue')}</button>
  }
  if (step === STEP.DETAILS) {
    return <button className="btn btn--primary" disabled={busy} onClick={onDetails}>{busy ? t('sending') : t('sendOtp')}</button>
  }
  if (step === STEP.VERIFY) {
    return <button className="btn btn--primary" disabled={busy} onClick={onVerify}>{busy ? t('verifying') : t('verifyConfirm')}</button>
  }
  return null
}

function TestSelectionStep({ packages, tests, selectedPackages, selectedTests, togglePackage, toggleTest, t }) {
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

function ScheduleStep({ date, setDate, slots, slotId, setSlotId, t }) {
  const days = nextDays(7)
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

      {date && (
        <>
          <h2 className="section-title">{t('pickSlot')}</h2>
          {slots.length === 0 && <p className="empty-note">{t('noSlots')}</p>}
          <div className="slot-list">
            {slots.map((s) => (
              <button
                key={s.id}
                className={`slot-chip ${slotId === s.id ? 'is-selected' : ''}`}
                onClick={() => setSlotId(s.id)}
              >
                {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
              </button>
            ))}
          </div>
        </>
      )}
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
      <p className="details-step__note">{t('otpNote')}</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function VerifyStep({ phone, otpCode, setOtpCode, onResend, error, t }) {
  return (
    <div className="verify-step">
      <p className="verify-step__sub">{t('otpSentTo')} +91 {phone}</p>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={6}
        className="otp-input"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="• • • • • •"
      />
      {error && <p className="field-error">{error}</p>}
      <div className="verify-step__resend">
        <span>{t('otpNotReceived')}</span>
        <button className="btn btn--ghost" onClick={() => onResend('whatsapp')}>{t('resendWhatsapp')}</button>
        <button className="btn btn--ghost" onClick={() => onResend('call')}>{t('resendCall')}</button>
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
