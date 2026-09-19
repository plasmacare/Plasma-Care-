/**
 * Every generated report PDF (from a booking, or from the standalone
 * Report Generation tab) is uploaded to Cloudinary using an unsigned
 * upload preset — directly from the browser, no server-side secret
 * needed — so the link shared with a customer never reveals that the
 * app runs on Supabase. Report content and the test-parameter catalog
 * (name/unit/reference per test) live in Supabase — see testPanels.js
 * and portal/lib/reportBuilder.js. The report's actual design comes
 * from LabReportTemplate.jsx (Plasma Care's own branding) — nothing
 * here stores or serves another company's report file.
 */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function ensureConfigured() {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Missing Cloudinary configuration. Add VITE_CLOUDINARY_CLOUD_NAME and ' +
      'VITE_CLOUDINARY_UPLOAD_PRESET to your .env file (see .env.example) — ' +
      'needed only for the Report Generation admin tab.',
    )
  }
}

/**
 * Uploads a PDF (File or Blob) to Cloudinary and returns { url, publicId }.
 * `folder` groups files in the Cloudinary media library (e.g. by booking
 * id, or by test name for a standalone-generated report).
 */
export async function uploadPdfToCloudinary(file, folder) {
  ensureConfigured()
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)
  if (folder) form.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Cloudinary upload failed.')
  }
  return { url: data.secure_url, publicId: data.public_id }
}
