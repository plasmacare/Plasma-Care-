import { useEffect, useRef, useState } from 'react'
import { ASSISTANT_STRINGS } from '../../../lib/seniorAssistantStrings'
import { fetchVoiceClips } from '../../../lib/voiceClips'
import { uploadVoiceClip, deleteVoiceClip } from '../../lib/voiceClipsAdmin'

const KEYS = Object.keys(ASSISTANT_STRINGS.or)

export default function OdiaVoiceRecorder() {
  const [clips, setClips] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVoiceClips('or').then(setClips).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="slots-form-card">
      <h3>Odia voice clips</h3>
      <p className="portal-form__hint" style={{ marginBottom: 12 }}>
        Browsers can't speak Odia at all, so the guided assistant uses these recordings instead when a
        customer picks Odia. Record each phrase once (in your own voice), reading the Odia text shown below
        it exactly. This only covers the assistant <em>speaking</em> — it still can't understand spoken
        Odia back from the customer, so Odia mode stays type-to-answer.
      </p>
      {error && <p className="admin-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div>
          {KEYS.map((key) => (
            <ClipRow
              key={key}
              clipKey={key}
              text={ASSISTANT_STRINGS.or[key]}
              url={clips[key]}
              onSaved={(url) => setClips((c) => ({ ...c, [key]: url }))}
              onDeleted={() => setClips((c) => { const n = { ...c }; delete n[key]; return n })}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ClipRow({ clipKey, text, url, onSaved, onDeleted, onError }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  async function startRecording() {
    onError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setPreviewUrl(URL.createObjectURL(blob))
        streamRef.current?.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      onError('Microphone access is needed to record — check your browser/site permissions.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  async function handleSave() {
    if (!previewUrl) return
    setBusy(true)
    onError('')
    try {
      const blob = await fetch(previewUrl).then((r) => r.blob())
      const savedUrl = await uploadVoiceClip('or', clipKey, blob)
      onSaved(savedUrl)
      setPreviewUrl('')
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteVoiceClip('or', clipKey)
      onDeleted()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid #eee', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <strong>{clipKey}</strong>
        <span>{url ? '✅ Recorded' : '⚠️ Not yet recorded'}</span>
      </div>
      <p style={{ margin: 0 }}>{text}</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {!recording ? (
          <button type="button" className="btn btn--secondary" onClick={startRecording} disabled={busy}>🎙️ Record</button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={stopRecording}>⏹ Stop</button>
        )}
        {previewUrl && (
          <>
            <audio controls src={previewUrl} style={{ height: 32 }} />
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={busy}>
              {busy ? 'Saving…' : 'Save this recording'}
            </button>
          </>
        )}
        {url && !previewUrl && (
          <>
            <audio controls src={url} style={{ height: 32 }} />
            <button type="button" className="btn btn--ghost" onClick={handleDelete} disabled={busy}>Remove</button>
          </>
        )}
      </div>
    </div>
  )
}
