export async function getVerificationId(token, purpose) {
  let res
  try {
    res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-turnstile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Supabase's gateway rejects edge function requests with no
          // JWT at all before they even reach the function code — the
          // customer/B2B forms that call this aren't logged in, so
          // there's no user session token, but the public anon key
          // itself is a valid JWT and satisfies that check.
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token, purpose }),
      },
    )
  } catch (networkErr) {
    throw new Error(`Could not reach the verification service (${networkErr.message}). Check your connection and try again.`)
  }

  const rawText = await res.text()
  let body
  try {
    body = JSON.parse(rawText)
  } catch {
    throw new Error(`Verification service returned an unexpected response (HTTP ${res.status}): ${rawText.slice(0, 200)}`)
  }

  if (!res.ok) throw new Error(body.error || `Verification failed (HTTP ${res.status}).`)
  return body.verification_id
}
