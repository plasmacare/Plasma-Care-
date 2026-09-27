import { useState } from 'react'
import { listenOnce, isSpeechRecognitionSupported } from '../lib/voiceAssistant'

/**
 * Renders nothing if `speechLang` is falsy (assistant mode is off, or
 * the chosen assistant language has no speech support — Odia) or the
 * browser itself doesn't support speech recognition (e.g. Firefox).
 * The field it sits next to always still works by typing either way —
 * this is purely an additional input method, never the only one.
 */
export default function VoiceInputButton({ speechLang, onResult, label }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')

  if (!speechLang || !isSpeechRecognitionSupported()) return null

  async function handleClick() {
    setError('')
    setListening(true)
    try {
      const text = await listenOnce(speechLang)
      onResult(text)
    } catch (err) {
      setError(err.message === 'denied' ? 'Microphone permission needed.' : 'Didn\'t catch that — please try again or type.')
    } finally {
      setListening(false)
    }
  }

  return (
    <span className="voice-input-btn-wrap">
      <button
        type="button"
        className={`voice-input-btn${listening ? ' voice-input-btn--listening' : ''}`}
        onClick={handleClick}
        aria-label={label || 'Speak your answer'}
        title={label || 'Speak your answer'}
      >
        {listening ? '●' : '🎤'}
      </button>
      {error && <span className="voice-input-btn__error">{error}</span>}
    </span>
  )
}
