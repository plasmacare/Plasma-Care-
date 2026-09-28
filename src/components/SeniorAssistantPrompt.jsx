import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSeniorAssistantEnabled } from '../lib/seniorAssistant'
import { ASSISTANT_LANGS, ASSISTANT_STRINGS } from '../lib/seniorAssistantStrings'
import './SeniorAssistantPrompt.css'

/**
 * Inline card on the homepage (not a popup) — only rendered at all when
 * the Developer panel has the feature switched on. Shown right below
 * the Pathology Tests card.
 */
export default function SeniorAssistantPrompt() {
  const [enabled, setEnabled] = useState(false)
  const [pickingLanguage, setPickingLanguage] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSeniorAssistantEnabled().then(setEnabled).catch(() => {})
  }, [])

  function startWith(langCode) {
    localStorage.setItem('pc_assistant_lang', langCode)
    localStorage.setItem('pc_assistant_mode', '1')
    navigate('/book/pathology')
  }

  if (!enabled) return null
  const s = ASSISTANT_STRINGS.en

  return (
    <div className="senior-prompt-card senior-prompt-card--inline">
      {!pickingLanguage ? (
        <>
          <h3>{s.promptTitle}</h3>
          <p className="senior-prompt-card__native">{ASSISTANT_STRINGS.hi.promptTitle}</p>
          <p className="senior-prompt-card__native">{ASSISTANT_STRINGS.or.promptTitle}</p>
          <p>{s.promptBody}</p>
          <div className="senior-prompt-card__actions">
            <button type="button" className="btn btn--primary" onClick={() => setPickingLanguage(true)}>
              {s.yes} / {ASSISTANT_STRINGS.hi.yes} / {ASSISTANT_STRINGS.or.yes}
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>{s.chooseLanguage}</h3>
          <div className="senior-prompt-card__langs">
            {ASSISTANT_LANGS.map((l) => (
              <button key={l.code} type="button" className="btn btn--secondary" onClick={() => startWith(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
