import { useEffect, useState } from 'react'
import { fetchAvailableLegalPages } from '../../../lib/content'
import './seoTools.css'

const SITE_ORIGIN = window.location.origin + import.meta.env.BASE_URL

export default function SeoTools() {
  return (
    <div className="tab-panel">
      <p className="portal-form__hint" style={{ marginBottom: 16 }}>
        This site is a static single-page app on GitHub Pages — there's
        no server to generate these dynamically per-request, so a few of
        these tools produce text for you to paste into a file in{' '}
        <code>public/</code> and redeploy, rather than saving live from
        here. Each one says which.
      </p>
      <MetaAudit />
      <HeadSnippetBuilder />
      <SitemapGenerator />
      <RobotsEditor />
    </div>
  )
}

function MetaAudit() {
  const [html, setHtml] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(SITE_ORIGIN)
      .then((r) => r.text())
      .then(setHtml)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <Section title="Live meta tag audit"><p className="login-error">{error}</p></Section>
  if (!html) return <Section title="Live meta tag audit"><p>Checking the deployed page…</p></Section>

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const title = doc.querySelector('title')?.textContent || ''
  const description = doc.querySelector('meta[name="description"]')?.content || ''
  const canonical = doc.querySelector('link[rel="canonical"]')?.href || ''
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.content || ''
  const ogImage = doc.querySelector('meta[property="og:image"]')?.content || ''
  const viewport = doc.querySelector('meta[name="viewport"]')?.content || ''

  const checks = [
    { label: 'Title tag present', pass: !!title, detail: title || 'missing' },
    { label: 'Title length 30–60 chars', pass: title.length >= 30 && title.length <= 60, detail: `${title.length} chars` },
    { label: 'Meta description present', pass: !!description, detail: description || 'missing' },
    { label: 'Description length 50–160 chars', pass: description.length >= 50 && description.length <= 160, detail: `${description.length} chars` },
    { label: 'Canonical link tag', pass: !!canonical, detail: canonical || 'missing' },
    { label: 'Open Graph title (social previews)', pass: !!ogTitle, detail: ogTitle || 'missing' },
    { label: 'Open Graph image (social previews)', pass: !!ogImage, detail: ogImage || 'missing' },
    { label: 'Viewport meta (mobile)', pass: !!viewport, detail: viewport || 'missing' },
  ]

  return (
    <Section title="Live meta tag audit" subtitle="Reads the actual deployed index.html right now.">
      <div className="seo-checklist">
        {checks.map((c) => (
          <div key={c.label} className={`seo-check seo-check--${c.pass ? 'pass' : 'fail'}`}>
            <span className="seo-check__icon">{c.pass ? '✓' : '✗'}</span>
            <span className="seo-check__label">{c.label}</span>
            <span className="seo-check__detail">{c.detail}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function HeadSnippetBuilder() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ogImage, setOgImage] = useState('')

  const snippet = `<title>${escapeHtml(title || 'Plasma Care — Diagnostics & Home Sample Collection')}</title>
<meta name="description" content="${escapeHtml(description || 'Book pathology tests, home sample collection, and diagnostic reports online.')}" />
<link rel="canonical" href="${SITE_ORIGIN}" />
<meta property="og:title" content="${escapeHtml(title || 'Plasma Care')}" />
<meta property="og:description" content="${escapeHtml(description || '')}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />\n` : ''}<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />`

  return (
    <Section
      title="Head tag snippet builder"
      subtitle={<><strong>Paste result into <code>index.html</code>'s &lt;head&gt;</strong> and redeploy — a static SPA can't change what crawlers see any other way.</>}
    >
      <div className="portal-form">
        <label>Page title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Plasma Care — Diagnostics & Home Sample Collection" />
        <label>Meta description</label>
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Book pathology tests, home sample collection, and diagnostic reports online." />
        <label>Social preview image URL (optional)</label>
        <input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://.../preview.png" />
      </div>
      <CopyBlock text={snippet} />
    </Section>
  )
}

function SitemapGenerator() {
  const [legalPages, setLegalPages] = useState([])

  useEffect(() => {
    fetchAvailableLegalPages().then(setLegalPages).catch(() => {})
  }, [])

  const staticRoutes = ['/', '/book/pathology']
  const legalRoutes = legalPages.map((p) => `/pages/${p.slug}`)
  const allRoutes = [...staticRoutes, ...legalRoutes]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map((r) => `  <url>\n    <loc>${SITE_ORIGIN.replace(/\/$/, '')}${r}</loc>\n  </url>`).join('\n')}
</urlset>`

  return (
    <Section
      title="sitemap.xml generator"
      subtitle={<>Includes every legal page currently published. <strong>Save as <code>public/sitemap.xml</code></strong> and redeploy.</>}
    >
      <CopyBlock text={xml} />
    </Section>
  )
}

function RobotsEditor() {
  const [text, setText] = useState(
    `User-agent: *\nAllow: /\nDisallow: /portal/\n\nSitemap: ${SITE_ORIGIN.replace(/\/$/, '')}/sitemap.xml`,
  )

  return (
    <Section
      title="robots.txt"
      subtitle={<><code>/portal/</code> is blocked since it's staff/admin/B2B, not something search engines should index. <strong>Save as <code>public/robots.txt</code></strong> and redeploy.</>}
    >
      <textarea
        rows={5}
        style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <CopyBlock text={text} noBox />
    </Section>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div className="seo-section">
      <h3>{title}</h3>
      {subtitle && <p className="portal-form__hint">{subtitle}</p>}
      {children}
    </div>
  )
}

function CopyBlock({ text, noBox }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div>
      {!noBox && <pre className="seo-code">{text}</pre>}
      <button type="button" className="btn btn--secondary" onClick={copy} style={{ marginTop: 8 }}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
