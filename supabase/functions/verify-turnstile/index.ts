// Supabase Edge Function: verify-turnstile
//
// Called by the customer booking form and the B2B "Request Access" form
// right before they insert their row. Verifies the Cloudflare Turnstile
// token with Cloudflare using the SECRET key (kept here, server-side —
// never in frontend code), and if genuine, creates a short-lived,
// one-time-use row in `verified_submissions`. The frontend then passes
// that id along with its insert, and the database itself refuses the
// insert without a valid one (see turnstile_spam_protection.sql).
//
// Deploy: Supabase Dashboard -> Edge Functions -> Deploy a new function
// -> name it exactly "verify-turnstile" -> paste this file's contents.
//
// One secret needs to be set (Dashboard -> Edge Functions ->
// verify-turnstile -> Secrets): TURNSTILE_SECRET_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY')!

const VALID_PURPOSES = ['booking', 'b2b_request']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, purpose } = await req.json()
    if (!token || !purpose) return json({ error: 'token and purpose are required' }, 400)
    if (!VALID_PURPOSES.includes(purpose)) return json({ error: 'invalid purpose' }, 400)

    const remoteip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || undefined

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip }),
    })
    const verifyData = await verifyRes.json()

    if (!verifyData.success) {
      return json({ error: 'Turnstile verification failed', details: verifyData['error-codes'] }, 400)
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data, error } = await adminClient
      .from('verified_submissions')
      .insert({ purpose })
      .select('id')
      .single()
    if (error) return json({ error: error.message }, 500)

    return json({ verification_id: data.id })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
