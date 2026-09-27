import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSeniorAssistantEnabled } from '../lib/seniorAssistant'
import { ASSISTANT_LANGS, ASSISTANT_STRINGS } from '../lib/seniorAssistantStrings'
import './SeniorAssistantPrompt.css'

const DISMISS_KEY = 'pc_senior_prompt_dismissed'

export default function SeniorAssistantPrompt() {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pickingLanguage, setPickingLanguage] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return
    fetchSeniorAssistantEnabled().then((on) => {
      setEnabled(on)
      if (on) setVisible(true)
    }).catch(() => {})
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  function startWith(langCode) {
    localStorage.setItem('pc_assistant_lang', langCode)
    localStorage.setItem('pc_assistant_mode', '1')
    sessionStorage.setItem(DISMISS_KEY, '1')
    navigate('/book/pathology')
  }

  if (!enabled || !visible) return null
  const s = ASSISTANT_STRINGS.en // banner itself shown in English + native scripts together, since we don't know their language preference yet

  return (
    <div className="senior-prompt-overlay" onClick={dismiss}>
      <div className="senior-prompt-card" onClick={(e) => e.stopPropagation()}>
        <button className="senior-prompt-card__close" onClick={dismiss} aria-label="Close">×</button>

        {!pickingLanguage ? (
          <>
            <h2>{s.promptTitle}</h2>
            <p className="senior-prompt-card__native">{ASSISTANT_STRINGS.hi.promptTitle}</p>
            <p className="senior-prompt-card__native">{ASSISTANT_STRINGS.or.promptTitle}</p>
            <p>{s.promptBody}</p>
            <div className="senior-prompt-card__actions">
              <button type="button" className="btn btn--primary" onClick={() => setPickingLanguage(true)}>
                {s.yes} / {ASSISTANT_STRINGS.hi.yes} / {ASSISTANT_STRINGS.or.yes}
              </button>
              <button type="button" className="btn btn--ghost" onClick={dismiss}>
                {s.no} / {ASSISTANT_STRINGS.hi.no} / {ASSISTANT_STRINGS.or.no}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{s.chooseLanguage}</h2>
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
    </div>
  )
}
