import { supabase } from '../../lib/supabase'
import { uploadPdfToCloudinary } from './cloudinary'

// Fixed set of categories, matching the "Panel Report Formats" /
// "Biochemistry Test Report Formats" / etc. folders supplied for the
// format library. Kept as a plain list (rather than derived from data)
// so the category picker in the UI has a stable order even before any
// templates have been uploaded yet.
export const TEMPLATE_CATEGORIES = [
  'Panel',
  'Haematology',
  'Biochemistry',
  'Clinical Pathology',
  'Endocrinology',
  'Microbiology',
  'Serology and Immunology',
]

function fromRow(row) {
  return {
    id: row.id,
    category: row.category,
    testName: row.test_name,
    fileName: row.file_name,
    storageUrl: row.storage_url,
    storagePublicId: row.storage_public_id,
    fields: row.fields || [],
  }
}

/** All templates, optionally filtered by category. */
export async function listTemplates(category) {
  let query = supabase.from('report_templates').select('*').order('test_name')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(fromRow)
}

/**
 * Uploads a reference format PDF to Cloudinary and creates its Supabase
 * record. `fields` starts empty — positions are added later via the
 * field mapper, once per template.
 */
export async function uploadTemplate({ category, testName, file }) {
  const { url, publicId } = await uploadPdfToCloudinary(file, `plasma-care-reports/formats/${category}`)
  const { data, error } = await supabase
    .from('report_templates')
    .insert({
      category,
      test_name: testName,
      file_name: file.name,
      storage_url: url,
      storage_public_id: publicId,
      fields: [],
    })
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

/** Saves the placed field positions for a template (from the field mapper). */
export async function saveTemplateFields(templateId, fields) {
  const { error } = await supabase
    .from('report_templates')
    .update({ fields, updated_at: new Date().toISOString() })
    .eq('id', templateId)
  if (error) throw error
}

/** Renames the test this template is linked to (used to match it during report generation). */
export async function renameTemplateTest(templateId, testName) {
  const { error } = await supabase
    .from('report_templates')
    .update({ test_name: testName, updated_at: new Date().toISOString() })
    .eq('id', templateId)
  if (error) throw error
}

/**
 * Removes the template's Supabase record. The Cloudinary file itself is
 * uploaded via an unsigned preset (no secret in the browser), so it
 * can't be deleted from client-side code — it's simply left orphaned on
 * Cloudinary (safe to clean up later from the dashboard if needed).
 */
export async function deleteTemplate(template) {
  const { error } = await supabase.from('report_templates').delete().eq('id', template.id)
  if (error) throw error
}

/**
 * Finds the best-matching template for a given test name (case/space
 * insensitive exact match first, then a loose "contains" match so
 * e.g. "SGOT (AST)" still matches a template named "SGOT").
 */
export function findTemplateForTest(templates, testName) {
  if (!testName) return null
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const target = norm(testName)
  const exact = templates.find((t) => norm(t.testName) === target)
  if (exact) return exact
  return templates.find((t) => target.includes(norm(t.testName)) || norm(t.testName).includes(target)) || null
}

/**
 * Overlays data onto a template's background PDF using pdf-lib, drawing
 * each field's value at its saved (percentage-based) position on page 1.
 * Returns a Blob ready to upload/download. Percentages are used instead
 * of absolute points so the mapping stays correct regardless of how the
 * PDF was rendered when the position was picked.
 */
export async function renderTemplateToPdfBlob(template, values) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
  const bytes = await fetch(template.storageUrl).then((r) => r.arrayBuffer())
  const pdfDoc = await PDFDocument.load(bytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const page = pdfDoc.getPage(0)
  const { width, height } = page.getSize()

  for (const field of template.fields || []) {
    const value = values[field.key]
    if (value === undefined || value === null || value === '') continue
    const x = (field.xPct / 100) * width
    // Stored yPct is measured from the top of the page (natural for
    // click-to-place UIs); pdf-lib draws from the bottom-left origin.
    const y = height - (field.yPct / 100) * height
    page.drawText(String(value), {
      x,
      y,
      size: field.fontSize || 10,
      font,
      color: rgb(0, 0, 0),
    })
  }

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes], { type: 'application/pdf' })
}

/** Uploads a generated (filled-in) report PDF to Cloudinary and returns its public URL. */
export async function uploadGeneratedReportPdf(bookingId, blob) {
  const file = new File([blob], 'report.pdf', { type: 'application/pdf' })
  const { url } = await uploadPdfToCloudinary(file, `plasma-care-reports/generated/${bookingId}`)
  return url
}
