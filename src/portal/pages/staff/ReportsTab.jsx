import { useEffect, useState } from 'react'
import {
  TEMPLATE_CATEGORIES, listTemplates, uploadTemplate, deleteTemplate, renameTemplateTest,
} from '../../lib/reportTemplates'
import TemplateFieldMapper from '../../components/TemplateFieldMapper'
import GenerateReportTab from './GenerateReportTab'

// Turns "sgot-report-format.pdf" into "Sgot" so a bulk upload of the
// original format files needs the least manual clean-up — the admin can
// still rename any of these afterwards.
function guessTestName(fileName) {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/-report-format$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ReportsTab() {
  const [mode, setMode] = useState('generate') // 'generate' | 'manage'
  const [category, setCategory] = useState(TEMPLATE_CATEGORIES[0])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [mappingTemplate, setMappingTemplate] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setTemplates(await listTemplates(category))
    } catch (err) {
      setError(err.message || 'Could not load templates. Check your Cloudinary configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [category])

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        await uploadTemplate({ category, testName: guessTestName(file.name), file })
      }
      await load()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRename(template) {
    const name = window.prompt('Test name for this format:', template.testName)
    if (!name || name === template.testName) return
    try {
      await renameTemplateTest(template.id, name.trim())
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(template) {
    if (!window.confirm(`Delete the "${template.testName}" format? This cannot be undone.`)) return
    try {
      await deleteTemplate(template)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="catalog">
      <h2>Report Generation</h2>
      <p className="portal-form__hint">
        Pick a test, fill in patient and result details, and get a pixel-perfect final report — using the
        original format PDF library below — ready to share. Format files are stored on Cloudinary;
        everything else (this library's data, bookings, etc.) stays on Supabase.
      </p>

      <div className="catalog__switch" style={{ marginBottom: 16 }}>
        <button type="button" className={mode === 'generate' ? 'is-active' : ''} onClick={() => setMode('generate')}>
          Generate Report
        </button>
        <button type="button" className={mode === 'manage' ? 'is-active' : ''} onClick={() => setMode('manage')}>
          Manage Formats
        </button>
      </div>

      {mode === 'generate' ? (
        <GenerateReportTab />
      ) : (
        <div>
      <div className="catalog__switch" style={{ flexWrap: 'wrap' }}>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button key={c} type="button" className={category === c ? 'is-active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ margin: '16px 0' }}>
        <label className="btn btn--primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
          {uploading ? 'Uploading…' : `Upload format PDF(s) to ${category}`}
          <input type="file" accept="application/pdf" multiple hidden disabled={uploading} onChange={handleFilesSelected} />
        </label>
        <p className="portal-form__hint">
          You can select several PDFs at once (e.g. the whole "{category}" folder). The test name is
          guessed from each file name — use "Rename" below to fix any of them.
        </p>
      </div>

      {error && <p className="login-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : templates.length === 0 ? (
        <p className="portal-form__hint">No formats uploaded yet for {category}.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>File</th>
              <th>Fields mapped</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td>{t.testName}</td>
                <td>
                  <a href={t.storageUrl} target="_blank" rel="noreferrer">{t.fileName}</a>
                </td>
                <td>{(t.fields || []).length}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setMappingTemplate(t)}>
                    {t.fields?.length ? 'Edit fields' : 'Map fields'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => handleRename(t)}>Rename</button>
                  <button type="button" className="btn btn--ghost" onClick={() => handleDelete(t)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {mappingTemplate && (
        <TemplateFieldMapper
          template={mappingTemplate}
          onClose={() => setMappingTemplate(null)}
          onSaved={(updated) => {
            setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            setMappingTemplate(null)
          }}
        />
      )}
        </div>
      )}
    </div>
  )
}
