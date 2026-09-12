export async function getVerificationId(token, purpose) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-turnstile`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, purpose }),
    },
  )
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Verification failed — please try the checkbox again.')
  return body.verification_id
}
