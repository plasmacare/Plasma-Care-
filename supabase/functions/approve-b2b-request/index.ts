// Supabase Edge Function: approve-b2b-request
//
// Called by the admin panel's B2B Requests tab when admin clicks Approve.
// Runs with the service-role key (kept server-side here, never in the
// frontend) so it can create a real Supabase Auth login and email the
// company an invite link to set their own password.
//
// Deploy: supabase functions deploy approve-b2b-request
// No extra secrets needed — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are auto-provided to every edge function.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401)
    }

    // Client scoped to the caller's own JWT — used only to confirm they
    // are actually an admin before we do anything privileged.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Invalid session' }, 401)

    const { data: callerProfile } = await callerClient
      .from('staff_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Only admin can approve B2B requests' }, 403)
    }

    const { request_id } = await req.json()
    if (!request_id) return json({ error: 'request_id is required' }, 400)

    // Service-role client — bypasses RLS, needed to create the Auth user
    // and write into b2b_accounts on the new user's behalf.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: reqRow, error: reqErr } = await adminClient
      .from('b2b_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (reqErr || !reqRow) return json({ error: 'Request not found' }, 404)
    if (reqRow.status === 'rejected') {
      return json({ error: 'This request was rejected — approve a fresh request instead.' }, 400)
    }
    // status is 'pending' (first approval) or 'approved' (resend) —
    // both fall through to the same invite call below. Supabase resends
    // a fresh invite token for an email that's still unconfirmed rather
    // than erroring, so this doubles as "Resend invite".

    // Creates the login AND emails them a "set your password" link.
    // redirectTo points at the site's plain root (no #route) — Supabase
    // appends the session as a #access_token=... hash fragment onto
    // exactly this URL. main.jsx catches that pattern before the
    // HashRouter mounts and turns it into a clean /portal/accept-invite
    // navigation, so the tokens never collide with app routing.
    const siteUrl = Deno.env.get('SITE_URL') || 'https://plasmacare.github.io/Plasma-Care-/'
    const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      reqRow.email,
      { redirectTo: siteUrl },
    )
    if (inviteErr) return json({ error: inviteErr.message }, 500)

    const newUserId = invited.user.id

    // Upsert, not insert — a resend targets the same auth user (Supabase
    // keeps the same id for an unconfirmed invitee), so this would
    // otherwise fail on the primary key the second time around.
    const { error: acctErr } = await adminClient.from('b2b_accounts').upsert({
      id: newUserId,
      request_id: reqRow.id,
      email: reqRow.email,
      company_name: reqRow.company_name,
      contact_name: reqRow.contact_name,
      phone: reqRow.phone,
      gstin: reqRow.gstin,
      address: reqRow.address,
    })
    if (acctErr) return json({ error: acctErr.message }, 500)

    if (reqRow.status !== 'approved') {
      await adminClient
        .from('b2b_requests')
        .update({ status: 'approved', reviewed_by: caller.id, reviewed_at: new Date().toISOString() })
        .eq('id', request_id)
    }

    return json({ ok: true, user_id: newUserId })
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
