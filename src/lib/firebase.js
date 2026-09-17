import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

/**
 * Firebase is used ONLY for the pixel-perfect report-format library and
 * report generation/rendering pipeline. Every other part of the app
 * (auth, bookings, catalog, payments, etc.) stays on Supabase — see
 * src/lib/supabase.js. Do not import this file outside the report
 * generation feature (src/portal/lib/reportTemplates.js and the
 * Report Generation admin tab).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let db = null
let storage = null
let auth = null

function ensureApp() {
  if (app) return app
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'Missing Firebase configuration. Add VITE_FIREBASE_* values to your .env file ' +
      '(see .env.example) — needed only for the Report Generation admin tab.',
    )
  }
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
  return app
}

export function getFirebaseDb() {
  ensureApp()
  return db
}

export function getFirebaseStorage() {
  ensureApp()
  return storage
}

/**
 * Firestore/Storage security rules for this project require a signed-in
 * Firebase user (see firebase/firestore.rules and firebase/storage.rules).
 * The app itself is authenticated via Supabase, not Firebase, so we sign
 * in anonymously to Firebase purely to satisfy those rules. This is only
 * reached from inside the staff/admin portal, which is already gated by
 * Supabase auth + role checks — anonymous Firebase auth here is just the
 * mechanism, not the access gate.
 */
export function ensureFirebaseSignedIn() {
  ensureApp()
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        unsub()
        if (user) {
          resolve(user)
        } else {
          signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject)
        }
      },
      reject,
    )
  })
}
