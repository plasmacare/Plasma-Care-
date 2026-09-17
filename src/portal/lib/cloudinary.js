/**
 * PDFs (report format library + generated reports) are stored on
 * Cloudinary using an unsigned upload preset, so they can be uploaded
 * directly from the browser without a server-side secret. Everything
 * else about the report library (which test a format belongs to, field
 * positions, etc.) lives in Supabase — see reportTemplates.js.
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
 * `folder` groups files in the Cloudinary media library (e.g. by category
 * for formats, or by booking id for generated reports).
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

/**
 * Cloudinary deletion needs a signed request (a secret, which can't live
 * in browser code), so unsigned uploads can't be deleted client-side.
 * Deleting a template here only removes its Supabase record; the file
 * itself is safe to leave orphaned on Cloudinary (or clean up later from
 * the Cloudinary dashboard / a server-side script with the API secret).
 */
export const CLOUDINARY_DELETE_REQUIRES_SERVER = true
