import { getFirebase } from './firebaseClient'
import { normalizeDigits } from '../lib/transliterate'
import { touchAccountActivity } from '../lib/customerAccounts'

/**
 * All Firestore reads/writes for the customer account page. Data lives
 * only under users/{uid}/..., and firebase/firestore.rules makes sure a
 * signed-in, email-verified customer can touch ONLY their own tree.
 * Every value is trimmed/limited here AND re-validated by the rules.
 */

export const LIMITS = { patients: 10, addresses: 5, bookingsShown: 50 }
export const GENDERS = ['male', 'female', 'other']
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
const BOOKING_TYPES = ['home_collection', 'lab_visit']
const UUID_RE = /^[0-9a-fA-F-]{36}$/

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max)

async function requireUser() {
  const fb = await getFirebase()
  await fb.auth.authStateReady()
  const user = fb.auth.currentUser
  if (!user) throw new Error('Please sign in again.')
  if (!user.emailVerified) throw new Error('Please verify your email first.')
  touchAccountActivity()
  return { fb, user }
}

function userDoc({ fb, user }) {
  return fb.fsMod.doc(fb.db, 'users', user.uid)
}
function subCol(ctx, name) {
  return ctx.fb.fsMod.collection(ctx.fb.db, 'users', ctx.user.uid, name)
}
const withId = (snap) => ({ id: snap.id, ...snap.data() })

// ---------------------------------------------------------------- profile
export async function loadProfile() {
  const ctx = await requireUser()
  const snap = await ctx.fb.fsMod.getDoc(userDoc(ctx))
  return snap.exists() ? snap.data() : null
}

/** Creates the profile on first sign-in, otherwise returns the existing one. */
export async function ensureProfile() {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const ref = userDoc(ctx)
  const snap = await fsMod.getDoc(ref)
  if (snap.exists()) return snap.data()
  const displayName = clean(ctx.user.displayName, 80)
  await fsMod.setDoc(ref, {
    displayName,
    createdAt: fsMod.serverTimestamp(),
    updatedAt: fsMod.serverTimestamp(),
  })
  return { displayName }
}

export async function saveProfile({ displayName, phone }) {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const digits = normalizeDigits(phone).replace(/\D/g, '').slice(-10)
  if (digits && !/^[6-9]\d{9}$/.test(digits)) throw new Error('Enter a valid 10-digit mobile number.')
  const name = clean(displayName, 80)
  if (!name) throw new Error('Please enter your name.')
  await fsMod.updateDoc(userDoc(ctx), { displayName: name, phone: digits, updatedAt: fsMod.serverTimestamp() })
  return { displayName: name, phone: digits }
}

// --------------------------------------------------------------- patients
function validatePatient(p) {
  const name = clean(p.name, 80)
  if (!name) throw new Error('Please enter the patient\'s name.')
  const out = { name, relation: clean(p.relation, 30), bloodGroup: BLOOD_GROUPS.includes(p.bloodGroup) ? p.bloodGroup : '' }
  out.gender = GENDERS.includes(p.gender) ? p.gender : ''
  const age = normalizeDigits(p.age).replace(/\D/g, '')
  if (age !== '') {
    const n = Number(age)
    if (!Number.isInteger(n) || n < 0 || n > 120) throw new Error('Age must be between 0 and 120.')
    out.age = n
  }
  return out
}

export async function listPatients() {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const snap = await fsMod.getDocs(fsMod.query(subCol(ctx, 'patients'), fsMod.orderBy('createdAt', 'desc'), fsMod.limit(LIMITS.patients + 5)))
  return snap.docs.map(withId)
}

export async function savePatient(patient, id) {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const data = validatePatient(patient)
  if (id) {
    // updateDoc merges, so a cleared age must be removed explicitly
    const update = { ...data, updatedAt: fsMod.serverTimestamp() }
    if (data.age === undefined) update.age = fsMod.deleteField()
    await fsMod.updateDoc(fsMod.doc(ctx.fb.db, 'users', ctx.user.uid, 'patients', id), update)
    return id
  }
  const existing = await fsMod.getDocs(fsMod.query(subCol(ctx, 'patients'), fsMod.limit(LIMITS.patients + 1)))
  if (existing.size >= LIMITS.patients) throw new Error(`You can save up to ${LIMITS.patients} patients. Remove one first.`)
  const ref = await fsMod.addDoc(subCol(ctx, 'patients'), {
    ...data, createdAt: fsMod.serverTimestamp(), updatedAt: fsMod.serverTimestamp(),
  })
  return ref.id
}

export async function deletePatient(id) {
  const ctx = await requireUser()
  await ctx.fb.fsMod.deleteDoc(ctx.fb.fsMod.doc(ctx.fb.db, 'users', ctx.user.uid, 'patients', id))
}

// -------------------------------------------------------------- addresses
function validateAddress(a) {
  const fullAddress = clean(a.fullAddress, 300)
  if (!fullAddress) throw new Error('Please enter the address.')
  return { label: clean(a.label, 40) || 'Home', fullAddress, landmark: clean(a.landmark, 120) }
}

export async function listAddresses() {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const snap = await fsMod.getDocs(fsMod.query(subCol(ctx, 'addresses'), fsMod.orderBy('createdAt', 'desc'), fsMod.limit(LIMITS.addresses + 5)))
  return snap.docs.map(withId)
}

export async function saveAddress(address, id) {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const data = validateAddress(address)
  if (id) {
    await fsMod.updateDoc(fsMod.doc(ctx.fb.db, 'users', ctx.user.uid, 'addresses', id), { ...data, updatedAt: fsMod.serverTimestamp() })
    return id
  }
  const existing = await fsMod.getDocs(fsMod.query(subCol(ctx, 'addresses'), fsMod.limit(LIMITS.addresses + 1)))
  if (existing.size >= LIMITS.addresses) throw new Error(`You can save up to ${LIMITS.addresses} addresses. Remove one first.`)
  const ref = await fsMod.addDoc(subCol(ctx, 'addresses'), {
    ...data, createdAt: fsMod.serverTimestamp(), updatedAt: fsMod.serverTimestamp(),
  })
  return ref.id
}

export async function deleteAddress(id) {
  const ctx = await requireUser()
  await ctx.fb.fsMod.deleteDoc(ctx.fb.fsMod.doc(ctx.fb.db, 'users', ctx.user.uid, 'addresses', id))
}

// --------------------------------------------------------------- bookings
/** Pulls a booking id out of either a bare id or a pasted /report/<id> or /pay/<id> link. */
export function extractBookingId(text) {
  const m = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.exec(String(text || ''))
  return m ? m[0].toLowerCase() : null
}

export async function linkBooking({ id, bookingType, scheduledDate, totalAmount, patientName }) {
  if (!id || !UUID_RE.test(id)) throw new Error('That booking id looks wrong.')
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const ref = fsMod.doc(ctx.fb.db, 'users', ctx.user.uid, 'bookings', id)
  const data = {
    bookingId: id,
    bookingType: BOOKING_TYPES.includes(bookingType) ? bookingType : '',
    scheduledDate: clean(scheduledDate, 10),
    totalAmount: Math.max(0, Number(totalAmount) || 0),
    linkedAt: fsMod.serverTimestamp(),
  }
  const pn = clean(patientName, 80)
  if (pn) data.patientName = pn
  await fsMod.setDoc(ref, data)
}

export async function listLinkedBookings() {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  const snap = await fsMod.getDocs(fsMod.query(subCol(ctx, 'bookings'), fsMod.orderBy('linkedAt', 'desc'), fsMod.limit(LIMITS.bookingsShown)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function unlinkBooking(id) {
  const ctx = await requireUser()
  await ctx.fb.fsMod.deleteDoc(ctx.fb.fsMod.doc(ctx.fb.db, 'users', ctx.user.uid, 'bookings', id))
}

// ----------------------------------------------------------- booking page
/** Everything the booking form can pre-fill. Returns null if nobody is signed in. */
export async function loadPrefill() {
  const fb = await getFirebase()
  await fb.auth.authStateReady()
  const user = fb.auth.currentUser
  if (!user || !user.emailVerified) return null
  const [profile, patients] = await Promise.all([loadProfile().catch(() => null), listPatients().catch(() => [])])
  return { profile, patients }
}

// -------------------------------------------------------- delete account
/** Deletes every document under users/{uid} (profile, patients, addresses, booking links). */
export async function deleteAllUserData() {
  const ctx = await requireUser()
  const { fsMod } = ctx.fb
  for (const name of ['patients', 'addresses', 'bookings']) {
    const snap = await fsMod.getDocs(subCol(ctx, name))
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = fsMod.writeBatch(ctx.fb.db)
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }
  await fsMod.deleteDoc(userDoc(ctx))
}
