/**
 * Firebase — used ONLY for the customer account page (login, profile,
 * saved patients/addresses, linked bookings). Supabase stays the primary
 * database for everything else; Cloudinary stays the home of reports.
 *
 * Everything is loaded with dynamic import() so a customer who never
 * opens /account never downloads a byte of the Firebase SDK.
 *
 * Deliberately NOT done here (security): Firestore offline persistence.
 * Health-related data is never cached in the browser's IndexedDB.
 *
 * Uses its own named app so it can never collide with the older
 * src/lib/firebase.js (report-format library) if that is ever used.
 */
const APP_NAME = 'customer-accounts'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured() {
  return !!(config.apiKey && config.authDomain && config.projectId && config.appId)
}

let cached = null

/** Resolves to { app, auth, db, authMod, fsMod }. Rejects with Error('ACCOUNT_NOT_CONFIGURED') if the env vars are missing. */
export function getFirebase() {
  if (cached) return cached
  cached = (async () => {
    if (!isFirebaseConfigured()) throw new Error('ACCOUNT_NOT_CONFIGURED')
    const [appMod, authMod, fsMod, appCheckMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
      import('firebase/app-check'),
    ])
    const existing = appMod.getApps().find((a) => a.name === APP_NAME)
    const app = existing || appMod.initializeApp(config, APP_NAME)

    // App Check: Firebase only accepts requests that come from THIS
    // website (proved with reCAPTCHA), not from a script or a copied
    // app that borrowed the public config. Must run before auth/db.
    const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY
    if (siteKey && !existing) {
      if (import.meta.env.DEV) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
      appCheckMod.initializeAppCheck(app, {
        provider: new appCheckMod.ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      })
    }

    const auth = authMod.getAuth(app)
    // Session lives only in this tab (bank-style): closing the tab or
    // browser signs the customer out.
    await authMod.setPersistence(auth, authMod.browserSessionPersistence)
    const db = fsMod.getFirestore(app)
    return { app, auth, db, authMod, fsMod }
  })()
  cached.catch(() => { cached = null })
  return cached
}
