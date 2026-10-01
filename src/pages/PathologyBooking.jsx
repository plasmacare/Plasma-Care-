import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepTracker from '../components/StepTracker'
import LocationPicker from '../components/LocationPicker'
import LanguageSwitcher from '../components/LanguageSwitcher'
import TurnstileWidget from '../components/TurnstileWidget'
import VoiceInputButton from '../components/VoiceInputButton'
import TutorialSpotlight from '../components/TutorialSpotlight'
import InstallAppPrompt from '../components/InstallAppPrompt'
import { getVerificationId } from '../lib/turnstile'
import { useLanguage } from '../lib/i18n.jsx'
import { ASSISTANT_LANGS, ASSISTANT_STRINGS } from '../lib/seniorAssistantStrings'
import { speak, stopSpeaking, findBestMatch, parseSpokenDate, playClip } from '../lib/voiceAssistant'
import { normalizeDigits } from '../lib/transliterate'
import { fetchVoiceClips } from '../lib/voiceClips'
import {
  fetchPackages, fetchTests, createBooking, savePatientDetails,
  uploadPrescription, analyzePrescription, savePrescriptionAiResult, savePrescriptionUploadError,
} from '../lib/booking'
import {
  fetchPaymentSettings, createPaymentRequest, upiLinkToQrImageUrl, uploadPaymentScreenshot, fetchBookingPayment,
} from '../lib/payment'
import './PathologyBooking.css'

const STEP = { PATIENT: 0, PRESCRIPTION: 1, TESTS: 2, TYPE: 3, LOCATION: 4, SCHEDULE: 5, DETAILS: 6, PAYMENT: 7, DONE: 8 }
const AI_CONFIDENCE_THRESHOLD = 99

// Formats a Date as YYYY-MM-DD using LOCAL date parts, not UTC — using
// toISOString() here would shift the date back a day for anyone booking
// between 12:00 AM and 5:30 AM IST, since IST is UTC+5:30.
function formatLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Collection hours end at 9 PM. Once we're past that, "today" is no
// longer a bookable slot, so it's dropped from the date picker until
// tomorrow.
const COLLECTION_HOURS_END = 21 // 9 PM, 24h clock

function nextDays(n) {
  const now = new Date()
  const startOffset = now.getHours() >= COLLECTION_HOURS_END ? 1 : 0
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + startOffset + i)
    return d
  })
}

export default function PathologyBooking() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [step, setStep] = useState(STEP.PATIENT)
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])
  const [selectedPackages, setSelectedPackages] = useState([])
  const [selectedTests, setSelectedTests] = useState([])
  const [bookingType, setBookingType] = useState(null)
  const [location, setLocation] = useState(null)
  const [date, setDate] = useState(null)
  const [prescriptionFile, setPrescriptionFile] = useState(null)
  const [prescriptionBusy, setPrescriptionBusy] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [bookingId, setBookingId] = useState(null)
  const [prescriptionUploadError, setPrescriptionUploadError] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [patientBloodGroup, setPatientBloodGroup] = useState('')
  const [paymentSettings, setPaymentSettings] = useState(null)
  const [paymentInfo, setPaymentInfo] = useState(null) // { amount, method, link }
  const [paymentError, setPaymentError] = useState('')
  const [createdBooking, setCreatedBooking] = useState(null)
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('')
  const [paymentScreenshotUploaded, setPaymentScreenshotUploaded] = useState(false)

  // Senior Citizen / guided assistant mode — opted into from the homepage
  // prompt (see SeniorAssistantPrompt.jsx). Nothing here changes normal
  // behavior for anyone who didn't opt in.
  const [assistantMode, setAssistantMode] = useState(() => localStorage.getItem('pc_assistant_mode') === '1')
  const [assistantLangCode] = useState(() => localStorage.getItem('pc_assistant_lang') || 'en')
  const assistantLang = ASSISTANT_LANGS.find((l) => l.code === assistantLangCode) || ASSISTANT_LANGS[0]
  const a = ASSISTANT_STRINGS[assistantLangCode] || ASSISTANT_STRINGS.en
  const assistantSpeechLang = assistantMode ? assistantLang.speech : null // null for Odia, or when assistant mode is off
  const [odiaClips, setOdiaClips] = useState({})

  useEffect(() => {
    if (assistantMode && assistantLangCode === 'or') {
      fetchVoiceClips('or').then(setOdiaClips).catch(() => {})
    }
  }, [assistantMode, assistantLangCode])

  function exitAssistantMode() {
    localStorage.removeItem('pc_assistant_mode')
    localStorage.removeItem('pc_assistant_lang')
    setAssistantMode(false)
  }

  // Reads the CURRENT FIELD's instruction aloud (not just the step) and
  // spotlights it — see guidedFields below. Odia has no browser voice,
  // so it plays a custom-recorded clip instead (Developer panel -> Odia
  // Voice) when one exists for that field; otherwise it stays silent
  // and relies on the Odia text already shown on screen.
  const footerRef = useRef(null)
  const patientNameRef = useRef(null)
  const patientAgeRef = useRef(null)
  const patientGenderRef = useRef(null)
  const patientBloodRef = useRef(null)
  const testsAreaRef = useRef(null)
  const typeAreaRef = useRef(null)
  const scheduleAreaRef = useRef(null)
  const detailsNameRef = useRef(null)
  const detailsPhoneRef = useRef(null)

  // A typed field only counts as "finished" once the person leaves it
  // (taps elsewhere / presses Done on the keyboard) — NOT on the first
  // character. Before this, typing a single letter or digit instantly
  // moved the spotlight to the next box, so names/ages/phone numbers
  // couldn't be typed in full.
  const [committed, setCommitted] = useState({})
  const commit = (key) => setCommitted((c) => (c[key] ? c : { ...c, [key]: true }))

  const guidedFields = useMemo(() => {
    if (!assistantMode) return []
    if (step === STEP.PATIENT) {
      return [
        { ref: patientNameRef, done: !!committed.patientName && !!patientName.trim(), captionKey: 'stepPatient' },
        { ref: patientAgeRef, done: !!committed.patientAge && !!patientAge.trim(), captionKey: 'stepAge' },
        { ref: patientGenderRef, done: !!patientGender, captionKey: 'stepGender' },
        { ref: patientBloodRef, done: !!patientBloodGroup, captionKey: 'stepBloodGroup' },
        { ref: footerRef, done: false, captionKey: 'next' },
      ]
    }
    if (step === STEP.TESTS) {
      return [
        { ref: testsAreaRef, done: selectedPackages.length + selectedTests.length > 0, captionKey: 'stepTests' },
        { ref: footerRef, done: false, captionKey: 'next' },
      ]
    }
    if (step === STEP.TYPE) {
      return [
        { ref: typeAreaRef, done: !!bookingType, captionKey: 'stepType' },
        { ref: footerRef, done: false, captionKey: 'next' },
      ]
    }
    if (step === STEP.SCHEDULE) {
      return [
        { ref: scheduleAreaRef, done: !!date, captionKey: 'stepSchedule' },
        { ref: footerRef, done: false, captionKey: 'next' },
      ]
    }
    if (step === STEP.DETAILS) {
      return [
        { ref: detailsNameRef, done: !!committed.name && !!name.trim(), captionKey: 'stepContactName' },
        { ref: detailsPhoneRef, done: !!committed.phone && phone.trim().length >= 10, captionKey: 'stepPhone' },
        { ref: footerRef, done: false, captionKey: 'confirm' },
      ]
    }
    return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantMode, step, patientName, patientAge, patientGender, patientBloodGroup, selectedPackages, selectedTests, bookingType, date, name, phone, committed])

  const [activeGuidedIndex, setActiveGuidedIndex] = useState(0)
  useEffect(() => { setActiveGuidedIndex(0) }, [step])
  useEffect(() => {
    if (!assistantMode || guidedFields.length === 0) return
    if (activeGuidedIndex < guidedFields.length - 1 && guidedFields[activeGuidedIndex]?.done) {
      setActiveGuidedIndex((i) => i + 1)
    }
  }, [assistantMode, guidedFields, activeGuidedIndex])

  const activeGuidedField = guidedFields[activeGuidedIndex]
  const activeCaptionKey = activeGuidedField?.captionKey

  function playAnnouncement(key) {
    if (assistantLangCode === 'or') playClip(odiaClips[key])
    else speak(a[key], assistantSpeechLang)
  }

  useEffect(() => {
    if (!assistantMode || !activeCaptionKey) return
    playAnnouncement(activeCaptionKey)
    // Cut the old line off as soon as the step/field changes, so a
    // previous step's announcement never talks over the new one.
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCaptionKey, assistantMode, odiaClips])

  // Steps with no spotlight (map, payment) still announce what to do —
  // spoken + shown in a banner that doesn't block the screen. Before
  // this the location step stayed silent in guided mode.
  const announceKey = step === STEP.LOCATION ? 'stepLocation' : step === STEP.PAYMENT ? 'stepPayment' : null
  useEffect(() => {
    if (!assistantMode || !announceKey) return
    playAnnouncement(announceKey)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantMode, announceKey, odiaClips])

  // Guided mode's job is done once the booking is confirmed — clear the
  // stored flags so a future normal visit doesn't stay in assistant
  // mode. (Done in an effect, not during render.)
  useEffect(() => {
    if (step === STEP.DONE && assistantMode) {
      localStorage.removeItem('pc_assistant_mode')
      localStorage.removeItem('pc_assistant_lang')
    }
  }, [step, assistantMode])

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchTests().then(setTests).catch(() => {})
    fetchPaymentSettings().then(setPaymentSettings).catch(() => {})
  }, [])

  const total = useMemo(() => {
    const pkgSum = packages.filter((p) => selectedPackages.includes(p.id)).reduce((s, p) => s + Number(p.price), 0)
    const testSum = tests.filter((t) => selectedTests.includes(t.id)).reduce((s, t) => s + Number(t.price), 0)
    return pkgSum + testSum
  }, [packages, tests, selectedPackages, selectedTests])

  const itemCount = selectedPackages.length + selectedTests.length
  const canProceedFromTests = itemCount > 0 || !!prescriptionFile

  const stepLabels = bookingType === 'lab_visit'
    ? [t('step_patient'), t('step_prescription'), t('step_tests'), t('step_type'), t('step_date'), t('step_details')]
    : [t('step_patient'), t('step_prescription'), t('step_tests'), t('step_type'), t('step_location'), t('step_date'), t('step_details')]

  const visualStep = Math.min(
    bookingType === 'lab_visit' && step >= STEP.LOCATION ? step - 1 : step,
    stepLabels.length - 1,
  )

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

  async function continueFromPrescription() {
    if (!prescriptionFile) {
      setStep(STEP.TESTS)
      return
    }
    setPrescriptionBusy(true)
    try {
      const result = await analyzePrescription(prescriptionFile)
      setAiResult(result)
      if ((result?.confidence ?? 0) >= AI_CONFIDENCE_THRESHOLD) {
        const ids = [...(result.matchedTestIds || []), ...(result.suggestedExtraTestIds || [])]
        const testIdSet = new Set(tests.map((x) => x.id))
        const packageIdSet = new Set(packages.map((x) => x.id))
        const newTests = ids.filter((id) => testIdSet.has(id))
        const newPackages = ids.filter((id) => packageIdSet.has(id))
        setSelectedTests((s) => Array.from(new Set([...s, ...newTests])))
        setSelectedPackages((s) => Array.from(new Set([...s, ...newPackages])))
      }
    } catch {
      // AI analysis failing shouldn't block the flow — customer can
      // still pick tests manually, and admin can read the photo directly.
      setAiResult(null)
    } finally {
      setPrescriptionBusy(false)
      setStep(STEP.TESTS)
    }
  }

  async function submitDetails() {
    setFormError('')
    if (!name.trim() || phone.trim().length < 10) {
      setFormError('Please enter your name and a 10-digit phone number.')
      return
    }
    if (!turnstileToken) {
      setFormError('Please complete the verification checkbox.')
      return
    }
    setBusy(true)
    try {
      const verificationId = await getVerificationId(turnstileToken, 'booking')
      const booking = await createBooking({
        customerName: name,
        customerPhone: phone,
        bookingType,
        selectedPackages,
        selectedTests,
        totalAmount: total,
        scheduledDate: formatLocalDate(date),
        address: location,
        verificationId,
        bookedViaSeniorAssistant: assistantMode,
      })
      await savePatientDetails(booking.id, {
        name: patientName,
        age: patientAge,
        gender: patientGender,
        bloodGroup: patientBloodGroup,
      }).catch(() => {})
      if (prescriptionFile) {
        try {
          await uploadPrescription(booking.id, prescriptionFile)
        } catch (uploadErr) {
          // Booking is already created — a failed prescription upload
          // shouldn't block the customer from finishing. But don't hide
          // it either: log it and let the confirmation screen mention it.
          console.error('Prescription upload failed:', uploadErr)
          const msg = uploadErr?.message || 'Unknown error'
          setPrescriptionUploadError(msg)
          await savePrescriptionUploadError(booking.id, msg).catch(() => {})
        }
      }
      if (aiResult) {
        await savePrescriptionAiResult(booking.id, aiResult).catch(() => {})
      }
      setBookingId(booking.id)
      setCreatedBooking(booking)

      if (paymentSettings?.enabled) {
        await attemptPaymentRequest(booking, paymentSettings)
      } else {
        setStep(STEP.DONE)
      }
    } catch (e) {
      setFormError(e?.message || 'Could not create your booking. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function attemptPaymentRequest(booking, settings) {
    setPaymentError('')
    try {
      const info = await createPaymentRequest(booking, settings)
      setPaymentInfo(info)
      setStep(STEP.PAYMENT)
    } catch (payErr) {
      // Payment is compulsory when enabled — don't let a setup failure
      // silently skip straight to confirmation. Show the payment step
      // with an error and a retry, instead of completing the booking.
      console.error('Payment request failed:', payErr)
      setPaymentError(payErr?.message || 'Could not set up payment. Please try again.')
      setStep(STEP.PAYMENT)
    }
  }

  if (step === STEP.DONE) {
    return (
      <ConfirmationScreen
        bookingId={bookingId}
        prescriptionUploadError={prescriptionUploadError}
        paymentInfo={paymentInfo}
        paymentScreenshotUploaded={paymentScreenshotUploaded}
        onHome={() => navigate('/')}
        t={t}
        showInstallPrompt={assistantMode}
        assistantStrings={a}
        assistantMode={assistantMode}
        assistantLangCode={assistantLangCode}
        assistantSpeechLang={assistantSpeechLang}
        odiaClips={odiaClips}
      />
    )
  }

  return (
    <div className={`page${assistantMode ? ' senior-mode' : ''}`}>
      <div className="page-header">
        {step !== STEP.PAYMENT && (
          <button className="page-header__back" onClick={() => (step === 0 ? navigate('/') : setStep(assistantMode && step === STEP.TESTS ? STEP.PATIENT : step - (bookingType === 'lab_visit' && step === STEP.SCHEDULE ? 2 : 1)))}>
            <BackIcon />
          </button>
        )}
        <h1>{t('bookingTitle')}</h1>
        <div className="page-header__spacer" />
        {!assistantMode && <LanguageSwitcher />}
      </div>

      {assistantMode && (
        <div className="assistant-bar">
          <span>🗣️ {assistantLang.label} — {a.tapToSpeak}</span>
          <button type="button" className="assistant-bar__exit" onClick={exitAssistantMode}>
            {a.exitAssistant}
          </button>
        </div>
      )}

      <StepTracker steps={stepLabels} currentStep={visualStep} />

      {assistantMode && announceKey && (
        <div className="announce-bar">
          <p>{a[announceKey]}</p>
          <button type="button" onClick={() => playAnnouncement(announceKey)} aria-label="Repeat">🔊</button>
        </div>
      )}

      {step === STEP.PATIENT && (
        <PatientDetailsStep
          name={patientName} setName={setPatientName}
          age={patientAge} setAge={setPatientAge}
          gender={patientGender} setGender={setPatientGender}
          bloodGroup={patientBloodGroup} setBloodGroup={setPatientBloodGroup}
          t={t}
          assistantSpeechLang={assistantSpeechLang}
          nameRef={patientNameRef} ageRef={patientAgeRef} genderRef={patientGenderRef} bloodRef={patientBloodRef}
          onCommit={commit}
        />
      )}

      {step === STEP.PRESCRIPTION && (
        <PrescriptionStep file={prescriptionFile} setFile={setPrescriptionFile} t={t} />
      )}

      {step === STEP.TESTS && (
        <TestSelectionStep
          packages={packages}
          tests={tests}
          selectedPackages={selectedPackages}
          selectedTests={selectedTests}
          togglePackage={togglePackage}
          toggleTest={toggleTest}
          aiResult={aiResult}
          t={t}
          assistantSpeechLang={assistantSpeechLang}
          areaRef={testsAreaRef}
        />
      )}

      {step === STEP.TYPE && (
        <TypeStep bookingType={bookingType} setBookingType={setBookingType} t={t} assistantSpeechLang={assistantSpeechLang} a={a} areaRef={typeAreaRef} />
      )}

      {step === STEP.LOCATION && (
        <LocationPicker onConfirm={(loc) => { setLocation(loc); setStep(STEP.SCHEDULE) }} />
      )}

      {step === STEP.SCHEDULE && (
        <ScheduleStep date={date} setDate={setDate} t={t} assistantSpeechLang={assistantSpeechLang} areaRef={scheduleAreaRef} />
      )}

      {step === STEP.DETAILS && (
        <DetailsStep
          name={name} setName={setName}
          phone={phone} setPhone={setPhone}
          error={formError}
          t={t}
          onTurnstileVerify={setTurnstileToken}
          onTurnstileExpire={() => setTurnstileToken('')}
          assistantSpeechLang={assistantSpeechLang}
          nameRef={detailsNameRef} phoneRef={detailsPhoneRef}
          onCommit={commit}
        />
      )}

      {step === STEP.PAYMENT && (
        <PaymentStep
          info={paymentInfo}
          error={paymentError}
          onRetry={() => attemptPaymentRequest(createdBooking, paymentSettings)}
          bookingId={bookingId}
          screenshotUrl={paymentScreenshotUrl}
          onScreenshotUploaded={(url) => { setPaymentScreenshotUrl(url); setPaymentScreenshotUploaded(true) }}
          onContinue={() => setStep(STEP.DONE)}
          t={t}
        />
      )}

      {step !== STEP.LOCATION && step !== STEP.PAYMENT && (
        <div className="sticky-footer" ref={footerRef}>
          {step !== STEP.PATIENT && step !== STEP.PRESCRIPTION && (
            <div className="sticky-footer__summary">
              <div className="sticky-footer__amount">₹{total || 0}</div>
              <div className="sticky-footer__label">{itemCount} {itemCount !== 1 ? t('itemsSelected') : t('itemSelected')}</div>
            </div>
          )}
          <FooterButton
            step={step}
            itemCount={itemCount}
            canProceedFromTests={canProceedFromTests}
            bookingType={bookingType}
            date={date}
            busy={busy}
            prescriptionBusy={prescriptionBusy}
            patientName={patientName}
            onPatient={() => setStep(assistantMode ? STEP.TESTS : STEP.PRESCRIPTION)}
            onPrescription={continueFromPrescription}
            onTests={() => setStep(STEP.TYPE)}
            onType={goNextFromType}
            onSchedule={() => setStep(STEP.DETAILS)}
            onDetails={submitDetails}
            t={t}
          />
        </div>
      )}

      {assistantMode && activeGuidedField && (
        <TutorialSpotlight
          targetRef={activeGuidedField.ref}
          caption={a[activeCaptionKey]}
          skipLabel={a.exitAssistant}
          onSkip={exitAssistantMode}
        />
      )}
    </div>
  )
}

function FooterButton({
  step, itemCount, canProceedFromTests, bookingType, date, busy, prescriptionBusy, patientName,
  onPatient, onPrescription, onTests, onType, onSchedule, onDetails, t,
}) {
  if (step === STEP.PATIENT) {
    return <button className="btn btn--primary" disabled={!patientName.trim()} onClick={onPatient}>{t('continue')}</button>
  }
  if (step === STEP.PRESCRIPTION) {
    return (
      <button className="btn btn--primary" disabled={prescriptionBusy} onClick={onPrescription}>
        {prescriptionBusy ? t('analyzing') : t('continue')}
      </button>
    )
  }
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

function blurOnEnter(e) {
  if (e.key === 'Enter') e.currentTarget.blur()
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']

function PatientDetailsStep({ name, setName, age, setAge, gender, setGender, bloodGroup, setBloodGroup, t, assistantSpeechLang, nameRef, ageRef, genderRef, bloodRef, onCommit }) {
  return (
    <div className="details-step">
      <h2 className="section-title">{t('patientDetailsTitle')}</h2>
      <p className="details-step__note">{t('patientDetailsNote')}</p>
      <div className="field" ref={nameRef}>
        <label>{t('patientName')}</label>
        <div className="field__with-voice">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onCommit('patientName')}
            onKeyDown={blurOnEnter}
            enterKeyHint="next"
            autoComplete="off"
            placeholder={t('fullNamePlaceholder')}
          />
          <VoiceInputButton speechLang={assistantSpeechLang} onResult={(text) => { setName(text); onCommit('patientName') }} />
        </div>
      </div>
      <div className="field" ref={ageRef}>
        <label>{t('patientAge')}</label>
        <input
          type="text"
          inputMode="numeric"
          value={age}
          onChange={(e) => setAge(normalizeDigits(e.target.value).replace(/\D/g, '').slice(0, 3))}
          onBlur={() => onCommit('patientAge')}
          onKeyDown={blurOnEnter}
          enterKeyHint="done"
          autoComplete="off"
          placeholder={t('patientAgePlaceholder')}
        />
      </div>
      <div className="field" ref={genderRef}>
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
      <div className="field" ref={bloodRef}>
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

function PrescriptionStep({ file, setFile, t }) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  return (
    <div className="prescription-step">
      <h2 className="section-title">{t('prescriptionTitle')}</h2>
      <p className="prescription-step__note">{t('prescriptionNote')}</p>

      {file ? (
        <div className="prescription-upload__preview">
          <img src={previewUrl} alt="Prescription" />
          <button type="button" className="btn btn--ghost" onClick={() => setFile(null)}>{t('removePhoto')}</button>
        </div>
      ) : (
        <div className="prescription-upload__choices">
          <label className="btn btn--secondary btn--block prescription-upload__btn">
            {t('takePhoto')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
            />
          </label>
          <label className="btn btn--secondary btn--block prescription-upload__btn">
            {t('chooseFromGallery')}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
            />
          </label>
        </div>
      )}
      <p className="prescription-step__skip-note">{t('prescriptionSkipNote')}</p>
    </div>
  )
}

function TestSelectionStep({ packages, tests, selectedPackages, selectedTests, togglePackage, toggleTest, aiResult, t, assistantSpeechLang, areaRef }) {
  const [query, setQuery] = useState('')
  const [expandedPackageId, setExpandedPackageId] = useState(null)
  const q = query.trim().toLowerCase()
  const filteredPackages = q ? packages.filter((p) => p.name.toLowerCase().includes(q)) : packages
  const filteredTests = q ? tests.filter((tItem) => tItem.name.toLowerCase().includes(q)) : tests
  const aiApplied = aiResult && (aiResult.confidence ?? 0) >= AI_CONFIDENCE_THRESHOLD
  const testsById = useMemo(() => Object.fromEntries(tests.map((tItem) => [tItem.id, tItem])), [tests])

  function handleVoiceQuery(spokenText) {
    setQuery(spokenText)
    // A nice shortcut for voice: if it's an unambiguous match, select it
    // immediately instead of making the customer also tap the checkbox.
    const pkgMatch = findBestMatch(spokenText, packages)
    if (pkgMatch && !selectedPackages.includes(pkgMatch.id)) {
      togglePackage(pkgMatch.id)
      return
    }
    const testMatch = findBestMatch(spokenText, tests)
    if (testMatch && !selectedTests.includes(testMatch.id)) {
      toggleTest(testMatch.id)
    }
  }

  return (
    <div className="tests-step" ref={areaRef}>
      <div className="search-bar">
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchTestsPlaceholder')}
        />
        <VoiceInputButton speechLang={assistantSpeechLang} onResult={handleVoiceQuery} />
      </div>

      {aiApplied && (
        <div className="ai-banner">
          <strong>{t('aiPreSelectedTitle')}</strong>
          <p>{aiResult.summary}</p>
        </div>
      )}

      <h2 className="section-title">{t('packages')}</h2>
      <div className="item-list">
        {filteredPackages.map((p) => {
          const includedTests = (p.included_tests || []).map((id) => testsById[id]).filter(Boolean)
          const isExpanded = expandedPackageId === p.id
          return (
            <div key={p.id} className={`package-card ${selectedPackages.includes(p.id) ? 'is-selected' : ''}`}>
              <div className="item-row item-row--package">
                <input type="checkbox" checked={selectedPackages.includes(p.id)} onChange={() => togglePackage(p.id)} />
                <button
                  type="button"
                  className="item-row__info item-row__info--tappable"
                  onClick={() => setExpandedPackageId(isExpanded ? null : p.id)}
                >
                  <span className="item-row__name">{p.name}</span>
                  <span className="item-row__desc">
                    {p.description}
                    {includedTests.length > 0 && ` · ${includedTests.length} ${t('testsIncludedLabel')}`}
                  </span>
                </button>
                <span className="item-row__price">₹{p.price}</span>
                {includedTests.length > 0 && (
                  <button
                    type="button"
                    className={`package-card__chevron${isExpanded ? ' package-card__chevron--open' : ''}`}
                    onClick={() => setExpandedPackageId(isExpanded ? null : p.id)}
                    aria-label={t('testsIncludedLabel')}
                  >
                    <ChevronIcon />
                  </button>
                )}
              </div>
              {isExpanded && includedTests.length > 0 && (
                <div className="package-card__drawer">
                  <span className="package-card__drawer-title">{t('testsIncludedLabel')}</span>
                  <ul>
                    {includedTests.map((tItem) => (
                      <li key={tItem.id}>{tItem.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
        {filteredPackages.length === 0 && <p className="empty-note">{t('noResults')}</p>}
      </div>

      <h2 className="section-title">{t('individualTests')}</h2>
      <div className="item-list">
        {filteredTests.map((tItem) => (
          <label key={tItem.id} className={`item-row ${selectedTests.includes(tItem.id) ? 'is-selected' : ''}`}>
            <input type="checkbox" checked={selectedTests.includes(tItem.id)} onChange={() => toggleTest(tItem.id)} />
            <div className="item-row__info">
              <span className="item-row__name">{tItem.name}</span>
              <span className="item-row__desc">{tItem.category}</span>
            </div>
            <span className="item-row__price">₹{tItem.price}</span>
          </label>
        ))}
        {filteredTests.length === 0 && <p className="empty-note">{t('noResults')}</p>}
      </div>
    </div>
  )
}

function TypeStep({ bookingType, setBookingType, t, assistantSpeechLang, a, areaRef }) {
  function handleVoice(spokenText) {
    const text = spokenText.toLowerCase()
    if (['home', 'ghar', 'घर', 'ଘର'].some((w) => text.includes(w))) setBookingType('home_collection')
    else if (['lab', 'lab visit', 'लैब', 'ଲାବ'].some((w) => text.includes(w))) setBookingType('lab_visit')
  }
  return (
    <div className="type-step" ref={areaRef}>
      {assistantSpeechLang && (
        <div className="voice-choice-row">
          <VoiceInputButton speechLang={assistantSpeechLang} onResult={handleVoice} label={`${a.optionLab} / ${a.optionHome}`} />
          <span>{a.optionLab} / {a.optionHome}</span>
        </div>
      )}
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

function ScheduleStep({ date, setDate, t, assistantSpeechLang, areaRef }) {
  const days = nextDays(14)
  function handleVoice(spokenText) {
    const parsed = parseSpokenDate(spokenText)
    if (parsed) {
      const match = days.find((d) => d.toDateString() === parsed.toDateString())
      if (match) setDate(match)
    }
  }
  return (
    <div className="schedule-step" ref={areaRef}>
      <h2 className="section-title">{t('pickDate')}</h2>
      {assistantSpeechLang && (
        <div className="voice-choice-row">
          <VoiceInputButton speechLang={assistantSpeechLang} onResult={handleVoice} />
        </div>
      )}
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

function PaymentStep({ info, error, onRetry, bookingId, screenshotUrl, onScreenshotUploaded, onContinue, t }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [checking, setChecking] = useState(false)
  const [gatewayConfirmed, setGatewayConfirmed] = useState(false)
  const uploaded = !!screenshotUrl

  // Razorpay ("Gateway") payments confirm via webhook in the background —
  // poll the booking every few seconds so this step can move on by
  // itself the moment it's actually paid, with no way to skip ahead of it.
  useEffect(() => {
    if (!info || info.method !== 'razorpay' || gatewayConfirmed) return
    const id = setInterval(async () => {
      try {
        const booking = await fetchBookingPayment(bookingId)
        if (booking.payment_status === 'paid') {
          setGatewayConfirmed(true)
          clearInterval(id)
          onContinue()
        }
      } catch {
        // transient network hiccup — next tick will retry
      }
    }, 4000)
    return () => clearInterval(id)
  }, [info, bookingId, gatewayConfirmed]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFile(file) {
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadPaymentScreenshot(bookingId, file)
      onScreenshotUploaded(url)
    } catch (err) {
      setUploadError(err.message || 'Could not upload the screenshot. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRetry() {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  async function handleCheckNow() {
    setChecking(true)
    try {
      const booking = await fetchBookingPayment(bookingId)
      if (booking.payment_status === 'paid') {
        setGatewayConfirmed(true)
        onContinue()
      }
    } catch {
      // ignore — they can just try again
    } finally {
      setChecking(false)
    }
  }

  if (!info) {
    return (
      <div className="payment-step">
        <h2 className="section-title">{t('step_payment')}</h2>
        <p className="payment-step__hint payment-step__hint--error">
          {error || 'Something went wrong setting up payment.'}
        </p>
        <p className="payment-step__hint">
          Your booking details are saved — payment is required to finish. Please retry, or call/WhatsApp us at
          8112060205 if this keeps happening.
        </p>
        <button type="button" className="btn btn--primary btn--block" disabled={retrying} onClick={handleRetry}>
          {retrying ? 'Retrying…' : 'Retry payment setup'}
        </button>
      </div>
    )
  }

  return (
    <div className="payment-step">
      <h2 className="section-title">{t('step_payment')}</h2>
      <p className="payment-step__amount">₹{info.amount}</p>
      <span className="payment-step__due-label">{t('payment_dueLabel')}</span>

      {info.method === 'razorpay' ? (
        <>
          <a className="btn btn--primary btn--block" href={info.link} target="_blank" rel="noreferrer">
            {t('payment_payNowBtn')}
          </a>
          <p className="payment-step__hint">{t('payment_gatewayNote')}</p>
          <div className="payment-step__waiting">
            <span className="payment-step__spinner" />
            Waiting for payment confirmation…
          </div>
          <button type="button" className="btn btn--ghost btn--block" disabled={checking} onClick={handleCheckNow}>
            {checking ? 'Checking…' : "I've paid — check now"}
          </button>
        </>
      ) : uploaded ? (
        <>
          <div className="payment-step__icon">⏳</div>
          <p className="payment-step__hint">{t('payment_screenshotReceived')}</p>
          <img src={screenshotUrl} alt="Uploaded screenshot" className="payment-step__proof-preview" />
          <button type="button" className="btn btn--primary btn--block" onClick={onContinue}>
            {t('payment_continueBtn')}
          </button>
        </>
      ) : (
        <>
          <p className="payment-step__hint">{t('payment_scanHint')}</p>
          <img src={upiLinkToQrImageUrl(info.link)} alt="UPI QR code" className="payment-step__qr" />
          <a className="btn btn--secondary btn--block" href={info.link}>{t('payment_payNowBtn')}</a>
          <label className="btn btn--primary btn--block">
            {uploading ? t('payment_uploading') : t('payment_uploadBtn')}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={uploading}
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
          </label>
          {uploadError && <p className="field-error">{uploadError}</p>}
          <p className="payment-step__hint payment-step__hint--small">
            Payment is required to complete this booking — upload a screenshot once you've paid to continue.
          </p>
        </>
      )}
    </div>
  )
}

function DetailsStep({ name, setName, phone, setPhone, error, t, onTurnstileVerify, onTurnstileExpire, assistantSpeechLang, nameRef, phoneRef, onCommit }) {
  function handlePhoneVoice(spokenText) {
    const digits = normalizeDigits(spokenText).replace(/\D/g, '').slice(0, 10)
    if (digits) {
      setPhone(digits)
      onCommit('phone')
    }
  }
  return (
    <div className="details-step">
      <div className="field" ref={nameRef}>
        <label>{t('fullName')}</label>
        <div className="field__with-voice">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onCommit('name')}
            onKeyDown={blurOnEnter}
            enterKeyHint="next"
            autoComplete="off"
            placeholder={t('fullNamePlaceholder')}
          />
          <VoiceInputButton speechLang={assistantSpeechLang} onResult={(text) => { setName(text); onCommit('name') }} />
        </div>
      </div>
      <div className="field" ref={phoneRef}>
        <label>{t('phoneNumber')}</label>
        <div className="field__with-voice">
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(normalizeDigits(e.target.value).replace(/\D/g, '').slice(0, 10))}
            onBlur={() => onCommit('phone')}
            onKeyDown={blurOnEnter}
            enterKeyHint="done"
            autoComplete="off"
            placeholder={t('phonePlaceholder')}
          />
          <VoiceInputButton speechLang={assistantSpeechLang} onResult={handlePhoneVoice} />
        </div>
      </div>
      <p className="details-step__note">{t('contactNote')}</p>
      <TurnstileWidget onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} />
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function ConfirmationScreen({
  bookingId, prescriptionUploadError, paymentInfo, paymentScreenshotUploaded, onHome, t, showInstallPrompt, assistantStrings,
  assistantMode, assistantLangCode, assistantSpeechLang, odiaClips,
}) {
  const cardRef = useRef(null)
  const [saving, setSaving] = useState(false)

  function announce() {
    if (assistantLangCode === 'or') playClip(odiaClips?.bookingDone)
    else speak(assistantStrings.bookingDone, assistantSpeechLang)
  }

  // Guided mode: say the right thing for THIS screen (booking confirmed,
  // save a screenshot) — and make sure nothing from an earlier step is
  // still playing. Stops again when leaving the page.
  useEffect(() => {
    if (!assistantMode) return
    announce()
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantMode, odiaClips])

  async function handleSave() {
    setSaving(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#F5F3EE', scale: 2 })
      const link = document.createElement('a')
      link.download = `plasma-care-booking-${bookingId?.slice(0, 8) || 'confirmation'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('Could not save the screenshot. Please take a manual screenshot instead.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page confirmation-screen">
      {assistantMode && (
        <div className="announce-bar">
          <p>{assistantStrings.bookingDone}</p>
          <button type="button" onClick={announce} aria-label="Repeat">🔊</button>
        </div>
      )}
      <div className="confirmation-screen__card" ref={cardRef}>
        <div className="confirmation-screen__icon"><CheckIcon /></div>
        <h1>{t('bookingConfirmed')}</h1>
        <p className="confirmation-screen__id">{t('bookingId')}: {bookingId?.slice(0, 8).toUpperCase()}</p>
        <p className="confirmation-screen__hours">{t('storeHoursNote')}</p>
        <p className="confirmation-screen__note">{t('confirmationNote')} 8112060205</p>
        {paymentInfo && (
          <p className="confirmation-screen__payment">
            {paymentScreenshotUploaded
              ? `${t('payment_screenshotReceived')}`
              : paymentInfo.method === 'razorpay'
                ? `₹${paymentInfo.amount} — ${t('payment_gatewayNote')}`
                : `₹${paymentInfo.amount} pending — you can pay any time at the link sent to you.`}
          </p>
        )}
      </div>
      {prescriptionUploadError && (
        <p className="confirmation-screen__warning">
          {t('prescriptionUploadFailedNote')} 8112060205.
        </p>
      )}
      <button className="btn btn--primary" onClick={onHome}>{t('backToHome')}</button>
      <button className="btn btn--ghost" disabled={saving} onClick={handleSave}>
        {saving ? t('saving') : t('saveScreenshot')}
      </button>
      {showInstallPrompt && <InstallAppPrompt strings={assistantStrings} />}
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
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--slate)" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
}
function ChevronIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--slate)" strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
}
