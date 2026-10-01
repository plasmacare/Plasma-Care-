import { useEffect, useRef, useState } from 'react'
import { startListening, isSpeechRecognitionSupported } from '../lib/voiceAssistant'

const ERROR_TEXT = {
  denied: 'Microphone permission needed — allow it in your browser settings.',
  'no-speech': "Didn't hear anything — tap 🎤 and try again, or type.",
  network: 'Voice needs internet — please type instead.',
  busy: 'Microphone is busy — wait a moment and try again.',
  error: "Couldn't use the microphone — please type instead.",
  unsupported: '',
}

/**
 * Renders nothing if `speechLang` is falsy (assistant mode is off, or
 * the chosen assistant language has no speech support — Odia) or the
 * browser itself doesn't support speech recognition (e.g. Firefox).
 * The field it sits next to always still works by typing either way —
 * this is purely an additional input method, never the only one.
 *
 * Tap once to start, tap again to stop. Errors show in a small floating
 * note (never pushes the input around) and clear themselves.
 */
export default function VoiceInputButton({ speechLang, onResult, label }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const errorTimer = useRef(null)

  useEffect(() => () => {
    clearTimeout(errorTimer.current)
    try { recognitionRef.current?.abort() } catch { /* ignore */ }
  }, [])

  if (!speechLang || !isSpeechRecognitionSupported()) return null

  function showError(code) {
    const msg = ERROR_TEXT[code]
    if (!msg) return
    setError(msg)
    clearTimeout(errorTimer.current)
    errorTimer.current = setTimeout(() => setError(''), 5000)
  }

  function handleClick() {
    if (listening) {
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
      return
    }
    setError('')
    setListening(true)
    recognitionRef.current = startListening(speechLang, {
      onResult,
      onError: showError,
      onEnd: () => setListening(false),
    })
  }

  return (
    <span className="voice-input-btn-wrap">
      <button
        type="button"
        className={`voice-input-btn${listening ? ' voice-input-btn--listening' : ''}`}
        onClick={handleClick}
        aria-label={label || (listening ? 'Stop listening' : 'Speak your answer')}
        title={label || 'Speak your answer'}
      >
        {listening ? '●' : '🎤'}
      </button>
      {error && <span className="voice-input-btn__error" role="alert">{error}</span>}
    </span>
  )
}
