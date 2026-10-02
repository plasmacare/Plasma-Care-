import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'
import IdleGuard, { clearIdleMarker } from '../components/IdleGuard'
import { supabase } from '../lib/supabase'
import { markAccountSignedIn } from '../lib/customerAccounts'
import { getFirebase } from './firebaseClient'
import * as api from './accountApi'
import { checkPassword, passwordStrength } from './passwordPolicy'
import { recordFailure, clearFailures, lockRemainingMs } from './loginLock'
import './account.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const IDLE_MINUTES = 10

/** Turns a Firebase / Firestore error into a short, safe message (never leaks which emails exist). */
function friendly(err, { signingIn = false } = {}) {
  const code = err?.code || ''
  if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(code)) return ''
  if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email', 'auth/invalid-login-credentials'].includes(code)) {
    return signingIn ? 'Email or password is incorrect.' : 'That did not work. Please check the details and try again.'
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a few minutes, or reset your password.'
  if (code === 'auth/network-request-failed' || code === 'unavailable' || code === 'failed-precondition') return 'No internet connection. Please try again.'
  if (code === 'auth/user-disabled') return 'This account has been disabled. Please contact Plasma Care.'
  if (code === 'auth/email-already-in-use') return 'Could not create the account. If you already have one, sign in or reset your password.'
  if (code === 'auth/weak-password') return 'Please choose a stronger password.'
  if (code === 'auth/operation-not-allowed') return 'This sign-in method is not switched on yet. Please contact Plasma Care.'
  if (code === 'auth/account-exists-with-different-credential') return 'This email is already registered with a different sign-in method. Use that one.'
  if (code === 'auth/requires-recent-login') return 'For your security, please sign in again and retry.'
  if (code === 'auth/popup-blocked') return 'Your browser blocked the Google window. Allow pop-ups and try again.'
  if (code.includes('app-check')) return 'Security check failed. Refresh the page and try again.'
  if (code === 'permission-denied') return 'Access was denied. Please sign out, sign in again, and make sure your email is verified.'
  if (err?.message && !code) return err.message // our own validation messages
  return 'Something went wrong. Please try again.'
}

export default function AccountPage() {
  const navigate = useNavigate()
  const [fb, setFb] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | unconfigured | error | out | unverified | in
  const [user, setUser] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let unsub = () => {}
    let cancelled = false
    getFirebase()
      .then((f) => {
        if (cancelled) return
        setFb(f)
        f.authMod.getRedirectResult(f.auth).catch(() => {})
        unsub = f.authMod.onAuthStateChanged(f.auth, (u) => {
          setUser(u)
          if (!u) {
            markAccountSignedIn(false)
            setPhase('out')
          } else if (!u.emailVerified) {
            markAccountSignedIn(false)
            setPhase('unverified')
          } else {
            markAccountSignedIn(true)
            setPhase('in')
          }
        })
      })
      .catch((err) => {
        if (!cancelled) setPhase(err?.message === 'ACCOUNT_NOT_CONFIGURED' ? 'unconfigured' : 'error')
      })
    return () => { cancelled = true; unsub() }
  }, [])

  const signOut = useCallback(async (message = '') => {
    clearIdleMarker('account', 'session')
    markAccountSignedIn(false)
    if (message) setNotice(message)
    try { await fb?.authMod.signOut(fb.auth) } catch { /* already signed out */ }
  }, [fb])

  const body = (() => {
    if (phase === 'loading') return <p className="acct-muted">Loading…</p>
    if (phase === 'unconfigured') {
      return <p className="acct-muted">Customer accounts are being set up. Please check back soon.</p>
    }
    if (phase === 'error') {
      return <p className="acct-error">Could not load the account service. Check your internet connection and refresh.</p>
    }
    if (phase === 'out') return <AuthScreen fb={fb} notice={notice} clearNotice={() => setNotice('')} />
    if (phase === 'unverified') {
      return (
        <VerifyScreen
          fb={fb}
          user={user}
          onVerified={() => { markAccountSignedIn(true); setPhase('in') }}
          onSignOut={() => signOut()}
        />
      )
    }
    return <Dashboard fb={fb} user={user} onSignOut={() => signOut()} />
  })()

  return (
    <div className="page acct-page">
      <div className="page-header">
        <button type="button" className="page-header__back" onClick={() => navigate('/')} aria-label="Back to home">
          <BackIcon />
        </button>
        <h1>My Account</h1>
        <div className="page-header__spacer" />
        <LanguageSwitcher />
      </div>
      <div className="acct-body">{body}</div>
      <IdleGuard
        enabled={phase === 'in' || phase === 'unverified'}
        timeoutMinutes={IDLE_MINUTES}
        warnSeconds={60}
        scope="account"
        persist="session"
        onTimeout={() => signOut(`You were signed out after ${IDLE_MINUTES} minutes of inactivity.`)}
      />
    </div>
  )
}

// ====================================================================
// Sign in / create account / forgot password
// ====================================================================
function AuthScreen({ fb, notice, clearNotice }) {
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [consent, setConsent] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  function switchMode(next) {
    setMode(next)
    setError('')
    setInfo('')
    setPassword('')
    setConfirm('')
    clearNotice()
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    clearNotice()
    const lock = lockRemainingMs()
    if (lock > 0) {
      setError(`Too many wrong attempts. Try again in ${Math.ceil(lock / 60000)} minute(s), or reset your password.`)
      return
    }
    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_RE.test(cleanEmail) || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    try {
      await fb.authMod.signInWithEmailAndPassword(fb.auth, cleanEmail, password)
      clearFailures()
    } catch (err) {
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(err?.code)) recordFailure()
      setError(friendly(err, { signingIn: true }))
    } finally {
      setBusy(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim().slice(0, 80)
    if (!cleanName) return setError('Please enter your name.')
    if (!EMAIL_RE.test(cleanEmail)) return setError('Enter a valid email address.')
    const pwProblem = checkPassword(password, cleanEmail)
    if (pwProblem) return setError(pwProblem)
    if (password !== confirm) return setError('The two passwords do not match.')
    if (!consent) return setError('Please tick the box to agree before creating your account.')
    setBusy(true)
    try {
      const cred = await fb.authMod.createUserWithEmailAndPassword(fb.auth, cleanEmail, password)
      await fb.authMod.updateProfile(cred.user, { displayName: cleanName }).catch(() => {})
      await fb.authMod.sendEmailVerification(cred.user).catch(() => {})
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_RE.test(cleanEmail)) return setError('Enter the email you registered with.')
    if (cooldown > 0) return undefined
    setBusy(true)
    try {
      await fb.authMod.sendPasswordResetEmail(fb.auth, cleanEmail)
    } catch (err) {
      if (err?.code === 'auth/network-request-failed' || err?.code === 'auth/too-many-requests') {
        setBusy(false)
        return setError(friendly(err))
      }
      // any other error (including "no such user") is deliberately hidden,
      // so this form can't be used to find out who has an account
    }
    setInfo('If an account exists for that email, a password reset link has been sent. Check your spam folder too.')
    setCooldown(60)
    setBusy(false)
    return undefined
  }

  async function handleGoogle() {
    setError('')
    clearNotice()
    setBusy(true)
    try {
      const provider = new fb.authMod.GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      try {
        await fb.authMod.signInWithPopup(fb.auth, provider)
      } catch (err) {
        if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
          await fb.authMod.signInWithRedirect(fb.auth, provider)
          return
        }
        throw err
      }
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  const strength = passwordStrength(password)

  return (
    <div className="acct-card">
      {notice && <p className="acct-notice">{notice}</p>}

      {mode !== 'forgot' && (
        <div className="acct-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-active' : ''} onClick={() => switchMode('signin')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => switchMode('signup')}>Create account</button>
        </div>
      )}

      {mode === 'forgot' ? (
        <form onSubmit={handleForgot} noValidate>
          <h2>Reset your password</h2>
          <p className="acct-muted">Enter your email and we'll send you a link to choose a new password.</p>
          <div className="field">
            <label htmlFor="acct-email">Email</label>
            <input id="acct-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="acct-error" role="alert">{error}</p>}
          {info && <p className="acct-success" role="status">{info}</p>}
          <button className="btn btn--primary btn--block" disabled={busy || cooldown > 0}>
            {cooldown > 0 ? `Send again in ${cooldown}s` : busy ? 'Sending…' : 'Send reset link'}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => switchMode('signin')}>Back to sign in</button>
        </form>
      ) : (
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} noValidate>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="acct-name">Your name</label>
              <input id="acct-name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label htmlFor="acct-email">Email</label>
            <input id="acct-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="acct-pw">Password</label>
            <div className="acct-pw-row">
              <input
                id="acct-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="acct-link" onClick={() => setShowPw((s) => !s)}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
            {mode === 'signup' && password && (
              <div className="acct-strength" aria-live="polite">
                <div className={`acct-strength__bar acct-strength__bar--${strength}`} />
                <span>{strength <= 2 ? 'Weak' : strength <= 3 ? 'OK' : 'Strong'}</span>
              </div>
            )}
          </div>
          {mode === 'signup' && (
            <>
              <p className="acct-hint">At least 10 characters, mixing 3 of: lowercase, UPPERCASE, numbers, symbols.</p>
              <div className="field">
                <label htmlFor="acct-confirm">Confirm password</label>
                <input id="acct-confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password" maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <label className="acct-check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree that Plasma Care may store my name, saved patients and addresses to make booking easier. I can delete all of it any time from this page.</span>
              </label>
            </>
          )}
          {error && <p className="acct-error" role="alert">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          {mode === 'signin' && (
            <button type="button" className="acct-link acct-link--center" onClick={() => switchMode('forgot')}>Forgot password?</button>
          )}
          <div className="acct-or"><span>or</span></div>
          <button type="button" className="btn btn--secondary btn--block" disabled={busy} onClick={handleGoogle}>
            Continue with Google
          </button>
        </form>
      )}
      <p className="acct-footnote">🔒 Your session ends automatically after {IDLE_MINUTES} minutes of inactivity or when you close this tab.</p>
    </div>
  )
}

// ====================================================================
// Email verification
// ====================================================================
function VerifyScreen({ fb, user, onVerified, onSignOut }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function resend() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await fb.authMod.sendEmailVerification(user)
      setInfo('Verification email sent. Check your inbox and spam folder.')
      setCooldown(60)
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  async function check() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await user.reload()
      if (!user.emailVerified) {
        setError('Your email is not verified yet. Open the link we emailed you, then tap this button again.')
        return
      }
      await user.getIdToken(true) // so the database sees the verified status
      onVerified()
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="acct-card">
      <h2>Verify your email</h2>
      <p className="acct-muted">
        We sent a verification link to <strong>{user.email}</strong>. Open it, then come back here. This keeps your
        health details private to you.
      </p>
      {error && <p className="acct-error" role="alert">{error}</p>}
      {info && <p className="acct-success" role="status">{info}</p>}
      <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={check}>I've verified — continue</button>
      <button type="button" className="btn btn--secondary btn--block" disabled={busy || cooldown > 0} onClick={resend}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
      </button>
      <button type="button" className="btn btn--ghost btn--block" onClick={onSignOut}>Use a different account</button>
    </div>
  )
}

// ====================================================================
// Signed-in dashboard
// ====================================================================
const TABS = [
  ['profile', 'Profile'],
  ['patients', 'Patients'],
  ['addresses', 'Addresses'],
  ['bookings', 'Bookings'],
  ['security', 'Security'],
]

function Dashboard({ fb, user, onSignOut }) {
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.ensureProfile().then(setProfile).catch((err) => setError(friendly(err)))
  }, [])

  return (
    <div>
      <div className="acct-hello">
        <p className="acct-hello__name">Hello, {profile?.displayName || user.displayName || 'there'}</p>
        <p className="acct-muted">{user.email}</p>
      </div>
      <div className="acct-tabs acct-tabs--scroll" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {error && <p className="acct-error" role="alert">{error}</p>}
      <div className="acct-card">
        {tab === 'profile' && <ProfileTab user={user} profile={profile} setProfile={setProfile} />}
        {tab === 'patients' && <PatientsTab />}
        {tab === 'addresses' && <AddressesTab />}
        {tab === 'bookings' && <BookingsTab />}
        {tab === 'security' && <SecurityTab fb={fb} user={user} onSignOut={onSignOut} />}
      </div>
    </div>
  )
}

function ProfileTab({ user, profile, setProfile }) {
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  async function save(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)
    try {
      const next = await api.saveProfile({ displayName, phone })
      setProfile((p) => ({ ...p, ...next }))
      setSaved(true)
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  if (!profile) return <p className="acct-muted">Loading…</p>
  return (
    <form onSubmit={save} noValidate>
      <div className="field">
        <label htmlFor="acct-p-name">Name</label>
        <input id="acct-p-name" type="text" maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="acct-p-phone">Mobile number (used to pre-fill bookings)</label>
        <input id="acct-p-phone" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" value={user.email || ''} readOnly disabled />
      </div>
      {error && <p className="acct-error" role="alert">{error}</p>}
      {saved && <p className="acct-success" role="status">Saved.</p>}
      <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  )
}

const EMPTY_PATIENT = { name: '', age: '', gender: '', bloodGroup: '', relation: '' }

function PatientsTab() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(null) // null = closed; object = editing/adding
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => api.listPatients().then(setItems).catch((err) => { setItems([]); setError(friendly(err)) }), [])
  useEffect(() => { load() }, [load])

  function openForm(p) {
    setError('')
    setEditingId(p?.id || null)
    setForm(p ? { name: p.name || '', age: p.age ?? '', gender: p.gender || '', bloodGroup: p.bloodGroup || '', relation: p.relation || '' } : { ...EMPTY_PATIENT })
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.savePatient(form, editingId)
      setForm(null)
      await load()
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove(p) {
    if (!window.confirm(`Remove ${p.name}?`)) return
    try {
      await api.deletePatient(p.id)
      await load()
    } catch (err) {
      setError(friendly(err))
    }
  }

  if (items === null) return <p className="acct-muted">Loading…</p>
  return (
    <div>
      <p className="acct-muted">Save the people you book tests for (yourself, parents, children…). They appear as one-tap choices when you book.</p>
      {error && <p className="acct-error" role="alert">{error}</p>}
      {items.length === 0 && !form && <p className="acct-muted">No saved patients yet.</p>}
      {items.map((p) => (
        <div key={p.id} className="acct-row">
          <div>
            <strong>{p.name}</strong>
            <span className="acct-sub">{[p.relation, p.age != null ? `${p.age} yrs` : '', p.gender, p.bloodGroup].filter(Boolean).join(' · ')}</span>
          </div>
          <div className="acct-row__actions">
            <button type="button" className="acct-link" onClick={() => openForm(p)}>Edit</button>
            <button type="button" className="acct-link acct-link--danger" onClick={() => remove(p)}>Remove</button>
          </div>
        </div>
      ))}
      {form ? (
        <form onSubmit={save} noValidate className="acct-subform">
          <div className="field"><label>Patient name</label>
            <input type="text" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Relation (optional)</label>
            <input type="text" maxLength={30} placeholder="e.g. Self, Mother" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} /></div>
          <div className="field"><label>Age</label>
            <input type="text" inputMode="numeric" maxLength={3} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value.replace(/\D/g, '').slice(0, 3) })} /></div>
          <div className="field"><label>Gender</label>
            <div className="acct-pills">
              {api.GENDERS.map((g) => (
                <button key={g} type="button" className={`acct-pill ${form.gender === g ? 'is-selected' : ''}`} onClick={() => setForm({ ...form, gender: form.gender === g ? '' : g })}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div></div>
          <div className="field"><label>Blood group</label>
            <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
              <option value="">Not set</option>
              {api.BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select></div>
          <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Saving…' : 'Save patient'}</button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setForm(null)}>Cancel</button>
        </form>
      ) : (
        <button type="button" className="btn btn--secondary btn--block" onClick={() => openForm(null)} disabled={items.length >= api.LIMITS.patients}>
          + Add patient
        </button>
      )}
    </div>
  )
}

const EMPTY_ADDRESS = { label: '', fullAddress: '', landmark: '' }

function AddressesTab() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => api.listAddresses().then(setItems).catch((err) => { setItems([]); setError(friendly(err)) }), [])
  useEffect(() => { load() }, [load])

  function openForm(a) {
    setError('')
    setEditingId(a?.id || null)
    setForm(a ? { label: a.label || '', fullAddress: a.fullAddress || '', landmark: a.landmark || '' } : { ...EMPTY_ADDRESS })
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.saveAddress(form, editingId)
      setForm(null)
      await load()
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove(a) {
    if (!window.confirm(`Remove "${a.label}"?`)) return
    try {
      await api.deleteAddress(a.id)
      await load()
    } catch (err) {
      setError(friendly(err))
    }
  }

  if (items === null) return <p className="acct-muted">Loading…</p>
  return (
    <div>
      <p className="acct-muted">Keep your home / office addresses here for quick reference.</p>
      {error && <p className="acct-error" role="alert">{error}</p>}
      {items.length === 0 && !form && <p className="acct-muted">No saved addresses yet.</p>}
      {items.map((a) => (
        <div key={a.id} className="acct-row">
          <div>
            <strong>{a.label}</strong>
            <span className="acct-sub">{a.fullAddress}{a.landmark ? ` (near ${a.landmark})` : ''}</span>
          </div>
          <div className="acct-row__actions">
            <button type="button" className="acct-link" onClick={() => openForm(a)}>Edit</button>
            <button type="button" className="acct-link acct-link--danger" onClick={() => remove(a)}>Remove</button>
          </div>
        </div>
      ))}
      {form ? (
        <form onSubmit={save} noValidate className="acct-subform">
          <div className="field"><label>Label</label>
            <input type="text" maxLength={40} placeholder="Home, Office…" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <div className="field"><label>Full address</label>
            <textarea rows={3} maxLength={300} value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} /></div>
          <div className="field"><label>Landmark (optional)</label>
            <input type="text" maxLength={120} value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} /></div>
          <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setForm(null)}>Cancel</button>
        </form>
      ) : (
        <button type="button" className="btn btn--secondary btn--block" onClick={() => openForm(null)} disabled={items.length >= api.LIMITS.addresses}>
          + Add address
        </button>
      )}
    </div>
  )
}

const STATUS_TEXT = {
  pending: 'Pending', confirmed: 'Confirmed', assigned: 'Assigned',
  in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
}

function BookingsTab() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [addText, setAddText] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const links = await api.listLinkedBookings()
      // live status + report link always come from Supabase, never a stale copy
      const live = await Promise.allSettled(links.map((l) => supabase.rpc('rpc_get_booking', { p_id: l.id })))
      setRows(links.map((l, i) => ({ ...l, live: live[i].status === 'fulfilled' ? live[i].value.data : null })))
    } catch (err) {
      setRows([])
      setError(friendly(err))
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function addEarlier(e) {
    e.preventDefault()
    setError('')
    const id = api.extractBookingId(addText)
    if (!id) return setError('Paste the booking id (or the report / payment link you received).')
    setAdding(true)
    try {
      const { data, error: rpcErr } = await supabase.rpc('rpc_get_booking', { p_id: id })
      if (rpcErr || !data) throw new Error('We could not find that booking.')
      await api.linkBooking({ id, bookingType: '', scheduledDate: '', totalAmount: data.total_amount, patientName: '' })
      setAddText('')
      await load()
    } catch (err) {
      setError(friendly(err))
    } finally {
      setAdding(false)
    }
  }

  async function unlink(id) {
    if (!window.confirm('Remove this booking from your account? The booking itself is not cancelled.')) return
    try {
      await api.unlinkBooking(id)
      await load()
    } catch (err) {
      setError(friendly(err))
    }
  }

  if (rows === null) return <p className="acct-muted">Loading…</p>
  return (
    <div>
      <p className="acct-muted">Bookings you make while signed in appear here automatically, with live status and your report.</p>
      {error && <p className="acct-error" role="alert">{error}</p>}
      {rows.length === 0 && <p className="acct-muted">No bookings linked yet.</p>}
      {rows.map((r) => {
        const live = r.live
        const reportReady = live?.report_status === 'uploaded' && typeof live.report_url === 'string' && /^https:\/\//i.test(live.report_url)
        return (
          <div key={r.id} className="acct-booking">
            <div className="acct-booking__top">
              <span>{r.scheduledDate || 'Date not recorded'}</span>
              <span className={`acct-badge acct-badge--${live?.status || 'pending'}`}>{live ? (STATUS_TEXT[live.status] || live.status) : 'Status unavailable'}</span>
            </div>
            <p className="acct-sub">
              {r.bookingType === 'home_collection' ? 'Home collection' : r.bookingType === 'lab_visit' ? 'Lab visit' : 'Booking'} · ₹{live?.total_amount ?? r.totalAmount}
              {r.patientName ? ` · ${r.patientName}` : ''}
            </p>
            {reportReady ? (
              <a className="btn btn--secondary btn--block" href={live.report_url} target="_blank" rel="noopener noreferrer">View report</a>
            ) : (
              <p className="acct-sub">{live?.report_status === 'skipped' ? 'No report for this booking.' : 'Report not ready yet.'}</p>
            )}
            <button type="button" className="acct-link acct-link--danger" onClick={() => unlink(r.id)}>Remove from my account</button>
          </div>
        )
      })}
      <form onSubmit={addEarlier} noValidate className="acct-subform">
        <div className="field">
          <label>Add an earlier booking</label>
          <input type="text" placeholder="Booking id or report/payment link" value={addText} onChange={(e) => setAddText(e.target.value)} />
        </div>
        <button className="btn btn--secondary btn--block" disabled={adding}>{adding ? 'Adding…' : 'Add booking'}</button>
      </form>
    </div>
  )
}

function SecurityTab({ fb, user, onSignOut }) {
  const providers = user.providerData.map((p) => p.providerId)
  const hasPassword = providers.includes('password')
  const hasGoogle = providers.includes('google.com')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [pw, setPw] = useState('')

  async function changePassword() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await fb.authMod.sendPasswordResetEmail(fb.auth, user.email)
      setInfo(`We emailed a link to ${user.email} to choose a new password.`)
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount(e) {
    e.preventDefault()
    setError('')
    if (confirmText.trim().toUpperCase() !== 'DELETE') return setError('Type DELETE to confirm.')
    if (hasPassword && !pw) return setError('Enter your password to confirm.')
    setBusy(true)
    try {
      // Re-authenticate first: deleting an account is a sensitive action.
      if (hasPassword) {
        const cred = fb.authMod.EmailAuthProvider.credential(user.email, pw)
        await fb.authMod.reauthenticateWithCredential(user, cred)
      } else if (hasGoogle) {
        await fb.authMod.reauthenticateWithPopup(user, new fb.authMod.GoogleAuthProvider())
      }
      await api.deleteAllUserData()
      await fb.authMod.deleteUser(user)
      clearIdleMarker('account', 'session')
      markAccountSignedIn(false)
    } catch (err) {
      setError(friendly(err, { signingIn: true }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="acct-muted">
        Signed in with {[hasPassword && 'email & password', hasGoogle && 'Google'].filter(Boolean).join(' + ') || 'your account'}.
        You'll be signed out automatically after {IDLE_MINUTES} minutes of inactivity or when you close this tab.
      </p>
      {error && <p className="acct-error" role="alert">{error}</p>}
      {info && <p className="acct-success" role="status">{info}</p>}
      {hasPassword && (
        <button type="button" className="btn btn--secondary btn--block" disabled={busy} onClick={changePassword}>Change password (email me a link)</button>
      )}
      <button type="button" className="btn btn--primary btn--block" onClick={onSignOut}>Sign out</button>

      <div className="acct-danger">
        <h3>Delete my account and data</h3>
        <p className="acct-muted">This permanently erases your profile, saved patients, addresses and booking links from Plasma Care's account system. Bookings already made, and their reports, are not affected.</p>
        {!deleting ? (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setDeleting(true)}>Delete my account…</button>
        ) : (
          <form onSubmit={deleteAccount} noValidate>
            <div className="field"><label>Type DELETE to confirm</label>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" /></div>
            {hasPassword && (
              <div className="field"><label>Your password</label>
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></div>
            )}
            <button className="btn btn--primary btn--block acct-btn-danger" disabled={busy}>{busy ? 'Deleting…' : 'Permanently delete'}</button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setDeleting(false)}>Cancel</button>
          </form>
        )}
      </div>
    </div>
  )
}

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
}
