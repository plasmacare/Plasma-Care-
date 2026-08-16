// Supabase Edge Function: analyze-prescription
// Sends a prescription photo to Claude (vision) along with the current
// test/package catalog, and asks it to (a) read what's written, (b)
// match it against real catalog items, (c) suggest a few closely related
// tests that are commonly ordered alongside what's written. Only acted
// on client-side if confidence >= 99 — anything less, the customer just
// picks tests manually as before.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Edge Function secret — Supabase Dashboard → Edge Functions →
// analyze-prescription → Secrets → ANTHROPIC_API_KEY.
// Get a key at https://console.anthropic.com — never put it in frontend code.
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const MODEL = 'claude-sonnet-5'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mediaType, tests, packages } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const catalogText = [
      'Individual tests (id: name):',
      ...(tests || []).map((t: { id: string; name: string }) => `${t.id}: ${t.name}`),
      '',
      'Packages (id: name):',
      ...(packages || []).map((p: { id: string; name: string }) => `${p.id}: ${p.name}`),
    ].join('\n')

    const prompt = `You are reading a doctor's prescription photo for a diagnostics lab. Below is the lab's current catalog of tests and packages (with their IDs).

${catalogText}

Read the prescription image and respond with ONLY a JSON object (no markdown, no other text) in this exact shape:
{
  "confidence": <0-100 integer, your honest confidence that you correctly read every test/investigation written on this prescription>,
  "matchedTestIds": [<catalog test/package IDs that are directly written on the prescription>],
  "suggestedExtraTestIds": [<catalog test/package IDs NOT written but commonly ordered alongside what IS written, e.g. HbA1c alongside a fasting glucose test — keep this list short and clinically sensible>],
  "summary": "<one or two plain-English sentences describing what you read>"
}

If the handwriting is unclear, the image is not a prescription, or you can't confidently match items to the catalog, set confidence low and leave the ID lists empty — do not guess.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'AI request failed', details: data }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const text = data?.content?.find((c: { type: string }) => c.type === 'text')?.text ?? ''
    let parsed
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)
    } catch {
      parsed = { confidence: 0, matchedTestIds: [], suggestedExtraTestIds: [], summary: 'Could not parse a reliable result.' }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err instanceof Error ? err.message : err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
