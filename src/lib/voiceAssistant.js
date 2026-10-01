/**
 * Uses ONLY the browser's own free Web Speech API — no paid cloud
 * service, no API key, no server call. That's a deliberate scope
 * decision (see the conversation this was built in): it means Odia
 * voice simply isn't available, because no browser ships Odia
 * speech-to-text or text-to-speech today. Hindi and English both work
 * reasonably well in Chrome/Android, which is what this site's
 * customers predominantly use.
 */

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

/** Speaks `text` aloud in the given speech locale (e.g. "hi-IN"). Resolves when speech finishes (or immediately if unsupported). */
export function speak(text, lang) {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported() || !lang) {
      resolve()
      return
    }
    window.speechSynthesis.cancel() // don't let utterances queue up/overlap
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 0.95 // slightly slower — easier to follow for this audience
    utter.onend = resolve
    utter.onerror = resolve
    window.speechSynthesis.speak(utter)
  })
}

let currentClip = null

/** Stops BOTH the browser voice and any pre-recorded clip that's playing — so an old step's announcement can never keep talking over the next step (or over the mic). */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
  if (currentClip) {
    try { currentClip.pause() } catch { /* ignore */ }
    currentClip = null
  }
}

/** Plays a pre-recorded clip (used for Odia, or any language with a custom-recorded voice). Resolves when playback finishes or errors. */
export function playClip(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve()
      return
    }
    stopSpeaking() // never let two announcements overlap
    const audio = new Audio(url)
    currentClip = audio
    audio.onended = resolve
    audio.onerror = resolve
    audio.play().catch(resolve)
  })
}

/**
 * Listens once and resolves with the recognized text (or rejects with a
 * short error code: 'unsupported' | 'no-speech' | 'denied' | 'error').
 * `lang` is a speech locale like "en-IN" / "hi-IN".
 */
export function listenOnce(lang) {
  return new Promise((resolve, reject) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition || !lang) {
      reject(new Error('unsupported'))
      return
    }
    const recognition = new Recognition()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    let settled = false
    recognition.onresult = (event) => {
      settled = true
      resolve(event.results[0][0].transcript)
    }
    recognition.onerror = (event) => {
      if (settled) return
      settled = true
      reject(new Error(event.error === 'not-allowed' ? 'denied' : event.error || 'error'))
    }
    recognition.onend = () => {
      if (!settled) reject(new Error('no-speech'))
    }
    try {
      recognition.start()
    } catch {
      reject(new Error('error'))
    }
  })
}

/**
 * Controllable version of listenOnce, used by the mic button: returns the
 * recognition object so it can be stopped by a second tap, and reports
 * specific error codes ('no-speech' | 'denied' | 'network' | 'busy' | 'error').
 * Always silences any announcement first — on Android Chrome the mic
 * fails ("audio-capture"/"aborted") if the page is still speaking.
 */
export function startListening(lang, { onResult, onError, onEnd }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Recognition || !lang) {
    onError('unsupported')
    onEnd()
    return null
  }
  stopSpeaking()
  const recognition = new Recognition()
  recognition.lang = lang
  recognition.interimResults = false
  recognition.continuous = false
  recognition.maxAlternatives = 1
  let gotResult = false
  let failed = false
  recognition.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript
    if (text) {
      gotResult = true
      onResult(text)
    }
  }
  recognition.onerror = (event) => {
    failed = true
    const code = event.error
    if (code === 'not-allowed' || code === 'service-not-allowed') onError('denied')
    else if (code === 'no-speech') onError('no-speech')
    else if (code === 'network') onError('network')
    else if (code === 'aborted') failed = false // user tapped stop / we cancelled — not an error to show
    else if (code === 'audio-capture') onError('busy')
    else onError('error')
  }
  recognition.onend = () => {
    if (!gotResult && !failed) onError('no-speech')
    onEnd()
  }
  // Give the speaker a moment to actually go quiet before the mic opens,
  // otherwise it hears its own voice (or refuses to start).
  setTimeout(() => {
    try {
      recognition.start()
    } catch {
      onError('error')
      onEnd()
    }
  }, 250)
  return recognition
}

/** Loose match: does the spoken/typed text refer to one of the yes/no-style options? Works across en/hi/or since it just checks a few common words in each language. */
export function matchesAffirmative(text) {
  const t = text.toLowerCase()
  return ['yes', 'yeah', 'sure', 'ok', 'haan', 'han', 'हाँ', 'ha', 'ହଁ'].some((w) => t.includes(w))
}
export function matchesNegative(text) {
  const t = text.toLowerCase()
  return ['no', 'nope', 'nahi', 'नहीं', 'ना', 'ନା'].some((w) => t.includes(w))
}

/** Fuzzy-picks the best matching test/package by name from spoken/typed text. Returns the item or null. */
export function findBestMatch(spokenText, items, nameKey = 'name') {
  const q = spokenText.toLowerCase().trim()
  if (!q) return null
  let best = items.find((i) => i[nameKey].toLowerCase() === q)
  if (best) return best
  best = items.find((i) => q.includes(i[nameKey].toLowerCase()) || i[nameKey].toLowerCase().includes(q))
  if (best) return best
  const qWords = new Set(q.split(/\s+/).filter((w) => w.length > 2))
  let bestScore = 0
  for (const item of items) {
    const words = item[nameKey].toLowerCase().split(/\s+/)
    const score = words.filter((w) => qWords.has(w)).length
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }
  return bestScore > 0 ? best : null
}

/** Parses "today" / "tomorrow" (in en/hi/or) into a Date; returns null if it doesn't recognize a relative date (caller falls back to their own date picker). */
export function parseSpokenDate(text) {
  const t = text.toLowerCase()
  const today = new Date()
  if (['today', 'aaj', 'आज', 'ଆଜି'].some((w) => t.includes(w))) return today
  if (['tomorrow', 'kal', 'कल', 'ଆସନ୍ତାକାଲି'].some((w) => t.includes(w))) {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d
  }
  return null
}
