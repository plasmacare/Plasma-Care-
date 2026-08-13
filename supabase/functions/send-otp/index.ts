// Supabase Edge Function: send-otp
// Two providers, split by channel:
//   - 'sms' (default) and 'whatsapp' (resend option) → NinzaSMS
//   - 'call' (alternative option, no SMS/WhatsApp needed) → 2Factor
// OTP generation/storage/verification logic is unchanged either way.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Edge Function secrets — Supabase Dashboard → Edge Functions → send-otp → Secrets.
// Never put these in frontend code.
const NINZA_API_KEY = Deno.env.get('NINZA_API_KEY')!
const NINZA_SENDER_ID = Deno.env.get('NINZA_SENDER_ID') ?? '16046'
const TWO_FACTOR_API_KEY = Deno.env.get('TWO_FACTOR_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function safeJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

// Postgrest/Supabase errors are plain objects, not Error instances —
// String(err) on them just gives "[object Object]". Pull out the actual
// message so failures are debuggable instead of opaque.
function describeError(err: unknown) {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>
    return String(anyErr.message ?? anyErr.error ?? JSON.stringify(err))
  }
  return String(err)
}

/* ---------- NinzaSMS (SMS + WhatsApp) ---------- */
async function sendViaNinza(phone: string, otp: string, route: 'sms' | 'waninza') {
  const tenDigit = phone.replace(/\D/g, '').slice(-10) // Ninza wants a plain 10-digit number
  const res = await fetch('https://ninzasms.in.net/auth/send_sms', {
    method: 'POST',
    headers: {
      Authorization: NINZA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender_id: NINZA_SENDER_ID,
      numbers: tenDigit,
      rout: route,
      variables_values: otp,
    }),
  })
  const body = await safeJson(res)
  return { ok: res.ok && body?.status === 'success', body }
}

/* ---------- 2Factor (Call fallback) ---------- */
async function sendViaTwoFactorVoice(phone: string, otp: string) {
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/VOICE/${phone}/${otp}`
  const res = await fetch(url)
  const body = await safeJson(res)
  return { ok: body?.Status === 'Success', body }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, channel } = await req.json()
    const requested: 'sms' | 'whatsapp' | 'call' = channel === 'whatsapp' || channel === 'call' ? channel : 'sms'

    if (!phone || phone.length < 10) {
      return new Response(JSON.stringify({ error: 'Valid phone number required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { error: dbError } = await supabase.from('otp_verifications').insert({
      phone,
      otp_code: otp,
      channel: requested,
      expires_at: expiresAt,
    })
    if (dbError) throw dbError

    let result
    let channelUsed: string = requested

    if (requested === 'call') {
      result = await sendViaTwoFactorVoice(phone, otp)
    } else if (requested === 'whatsapp') {
      result = await sendViaNinza(phone, otp, 'waninza')
      if (!result.ok) {
        // WhatsApp route didn't confirm — fall back to plain SMS so the
        // customer still gets a code rather than nothing.
        result = await sendViaNinza(phone, otp, 'sms')
        channelUsed = 'sms'
      }
    } else {
      result = await sendViaNinza(phone, otp, 'sms')
    }

    if (!result.ok) {
      return new Response(
        JSON.stringify({ error: 'OTP provider did not confirm delivery', details: result.body }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ success: true, channelUsed, providerResponse: result.body }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: describeError(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
