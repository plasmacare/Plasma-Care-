import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepTracker from '../components/StepTracker'
import LocationPicker from '../components/LocationPicker'
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
    ? ['Tests', 'Type', 'Slot', 'Details', 'Verify']
    : ['Tests', 'Type', 'Location', 'Slot', 'Details', 'Verify']

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
    return <ConfirmationScreen bookingId={bookingId} onHome={() => navigate('/')} />
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-header__back" onClick={() => (step === 0 ? navigate('/') : setStep(step - (bookingType === 'lab_visit' && step === STEP.SCHEDULE ? 2 : 1)))}>
          <BackIcon />
        </button>
        <h1>Pathology Booking</h1>
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
        />
      )}

      {step === STEP.TYPE && (
        <TypeStep bookingType={bookingType} setBookingType={setBookingType} />
      )}

      {step === STEP.LOCATION && (
        <LocationPicker onConfirm={(loc) => { setLocation(loc); setStep(STEP.SCHEDULE) }} />
      )}

      {step === STEP.SCHEDULE && (
        <ScheduleStep date={date} setDate={setDate} slots={slots} slotId={slotId} setSlotId={setSlotId} />
      )}

      {step === STEP.DETAILS && (
        <DetailsStep
          name={name} setName={setName}
          phone={phone} setPhone={setPhone}
          error={otpError}
        />
      )}

      {step === STEP.VERIFY && (
        <VerifyStep
          phone={phone}
          otpCode={otpCode} setOtpCode={setOtpCode}
          onResend={resendOtp}
          error={otpError}
        />
      )}

      {step !== STEP.LOCATION && (
        <div className="sticky-footer">
          <div className="sticky-footer__summary">
            <div className="sticky-footer__amount">₹{total || 0}</div>
            <div className="sticky-footer__label">{itemCount} item{itemCount !== 1 ? 's' : ''} selected</div>
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
          />
        </div>
      )}
    </div>
  )
}

function FooterButton({ step, itemCount, bookingType, date, slotId, busy, onTests, onType, onSchedule, onDetails, onVerify }) {
  if (step === STEP.TESTS) {
    return <button className="btn btn--primary" disabled={itemCount === 0} onClick={onTests}>Continue</button>
  }
  if (step === STEP.TYPE) {
    return <button className="btn btn--primary" disabled={!bookingType} onClick={onType}>Continue</button>
  }
  if (step === STEP.SCHEDULE) {
    return <button className="btn btn--primary" disabled={!date || !slotId} onClick={onSchedule}>Continue</button>
  }
  if (step === STEP.DETAILS) {
    return <button className="btn btn--primary" disabled={busy} onClick={onDetails}>{busy ? 'Sending…' : 'Send OTP'}</button>
  }
  if (step === STEP.VERIFY) {
    return <button className="btn btn--primary" disabled={busy} onClick={onVerify}>{busy ? 'Verifying…' : 'Verify & Confirm'}</button>
  }
  return null
}

function TestSelectionStep({ packages, tests, selectedPackages, selectedTests, togglePackage, toggleTest }) {
  return (
    <div className="tests-step">
      <h2 className="section-title">Packages</h2>
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

      <h2 className="section-title">Individual Tests</h2>
      <div className="item-list">
        {tests.map((t) => (
          <label key={t.id} className={`item-row ${selectedTests.includes(t.id) ? 'is-selected' : ''}`}>
            <input type="checkbox" checked={selectedTests.includes(t.id)} onChange={() => toggleTest(t.id)} />
            <div className="item-row__info">
              <span className="item-row__name">{t.name}</span>
              <span className="item-row__desc">{t.category}</span>
            </div>
            <span className="item-row__price">₹{t.price}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function TypeStep({ bookingType, setBookingType }) {
  return (
    <div className="type-step">
      <button
        className={`type-card ${bookingType === 'home_collection' ? 'is-selected' : ''}`}
        onClick={() => setBookingType('home_collection')}
      >
        <HomeIcon />
        <div>
          <h3>Home Collection</h3>
          <p>Our phlebotomist visits your address</p>
        </div>
      </button>
      <button
        className={`type-card ${bookingType === 'lab_visit' ? 'is-selected' : ''}`}
        onClick={() => setBookingType('lab_visit')}
      >
        <LabIcon />
        <div>
          <h3>Visit Lab</h3>
          <p>Walk in to our Kalinga Nagar center</p>
        </div>
      </button>
    </div>
  )
}

function ScheduleStep({ date, setDate, slots, slotId, setSlotId }) {
  const days = nextDays(7)
  return (
    <div className="schedule-step">
      <h2 className="section-title">Pick a Date</h2>
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
          <h2 className="section-title">Pick a Time Slot</h2>
          {slots.length === 0 && <p className="empty-note">Is din ke liye slots available nahi hain. Doosri date try karein.</p>}
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

function DetailsStep({ name, setName, phone, setPhone, error }) {
  return (
    <div className="details-step">
      <div className="field">
        <label>Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" />
      </div>
      <div className="field">
        <label>Phone Number</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" />
      </div>
      <p className="details-step__note">Booking confirm karne ke liye hum aapko WhatsApp pe OTP bhejenge.</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function VerifyStep({ phone, otpCode, setOtpCode, onResend, error }) {
  return (
    <div className="verify-step">
      <p className="verify-step__sub">+91 {phone} pe OTP bheja gaya hai</p>
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
        <span>OTP nahi mila?</span>
        <button className="btn btn--ghost" onClick={() => onResend('whatsapp')}>WhatsApp par dobara bhejein</button>
        <button className="btn btn--ghost" onClick={() => onResend('call')}>Call se OTP mangwayein</button>
      </div>
    </div>
  )
}

function ConfirmationScreen({ bookingId, onHome }) {
  return (
    <div className="page confirmation-screen">
      <div className="confirmation-screen__icon"><CheckIcon /></div>
      <h1>Booking Confirmed!</h1>
      <p className="confirmation-screen__id">Booking ID: {bookingId?.slice(0, 8).toUpperCase()}</p>
      <p className="confirmation-screen__note">Hum jald hi aapko WhatsApp pe confirmation bhejenge. Kisi bhi sawaal ke liye 8112060205 pe call/WhatsApp karein.</p>
      <button className="btn btn--primary" onClick={onHome}>Back to Home</button>
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
