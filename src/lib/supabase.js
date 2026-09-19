import { createClient } from '@supabase/supabase-js'
import { offlineAwareFetch } from './offlineFetch'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Thrown (not just logged) on purpose: without these, nothing in the
  // app can work anyway, and a clear message here beats the cryptic
  // "supabaseUrl is required" crash from inside the Supabase library.
  // Most common cause: running locally without a .env file — copy
  // .env.example to .env and fill in your project's values.
  throw new Error(
    'Missing Supabase configuration. Create a .env file in the project root with ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set (see .env.example), then restart the dev server.',
  )
}

// Custom fetch so writes made while offline (portal/staff/B2B panels) are
// queued and retried automatically instead of failing — see
// offlineFetch.js. Doesn't change behavior at all when online.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: offlineAwareFetch },
})
