// Supabase Edge Function: send-otp
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TWO_FACTOR_API_KEY = Deno.env.get('TWO_FACTOR_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// Safely parses a fetch response as JSON. If the upstream (2Factor) returns
// HTML or plain text instead of JSON (e.g. an error page for an endpoint
// that isn't set up yet), this returns null instead of throwing — so the
// caller can fall back instead of crashing the whole function.
async function safeJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function sendViaSms(phone: string, otp: string) {
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${phone}/${otp}`
  const res = await fetch(url)
  return safeJson(res)
}

async function sendViaVoice(phone: string, otp: string) {
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/VOICE/${phone}/${otp}`
  const res = await fetch(url)
  return safeJson(res)
}

async function sendViaWhatsapp(phone: string, otp: string) {
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/ADDON_SERVICES/SEND/WHATSAPP_OTP/${phone}/${otp}`
  const res = await fetch(url)
  return safeJson(res)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, channel } = await req.json()

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
      channel: channel || 'whatsapp',
      expires_at: expiresAt,
    })
    if (dbError) throw dbError

    let result
    let channelUsed = channel || 'whatsapp'

    if (channel === 'call') {
      result = await sendViaVoice(phone, otp)
    } else {
      result = await sendViaWhatsapp(phone, otp)
      // If WhatsApp didn't return a clean success, fall back to SMS —
      // this also covers the case where the WhatsApp endpoint isn't
      // provisioned yet on the 2Factor account.
      if (!result || result?.Status !== 'Success') {
        result = await sendViaSms(phone, otp)
        channelUsed = 'sms'
      }
    }

    if (!result || result?.Status !== 'Success') {
      return new Response(
        JSON.stringify({ error: 'OTP provider did not confirm delivery', details: result }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ success: true, channelUsed, twoFactorResponse: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
