import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import {
  ref, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage'
import { getFirebaseDb, getFirebaseStorage, ensureFirebaseSignedIn } from '../../lib/firebase'

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

const TEMPLATES_COLLECTION = 'report_templates'

function templatesRef() {
  return collection(getFirebaseDb(), TEMPLATES_COLLECTION)
}

/** All templates, optionally filtered by category. */
export async function listTemplates(category) {
  await ensureFirebaseSignedIn()
  const q = category
    ? query(templatesRef(), where('category', '==', category), orderBy('testName'))
    : query(templatesRef(), orderBy('category'), orderBy('testName'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Uploads a reference format PDF to Firebase Storage and creates its
 * Firestore record. `fields` starts empty — positions are added later
 * via the field mapper, once per template.
 */
export async function uploadTemplate({ category, testName, file }) {
  await ensureFirebaseSignedIn()
  const storage = getFirebaseStorage()
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const path = `report-templates/${category}/${Date.now()}-${safeName}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: 'application/pdf' })
  const downloadURL = await getDownloadURL(fileRef)

  const docRef = await addDoc(templatesRef(), {
    category,
    testName,
    fileName: file.name,
    storagePath: path,
    downloadURL,
    fields: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, category, testName, fileName: file.name, storagePath: path, downloadURL, fields: [] }
}

/** Saves the placed field positions for a template (from the field mapper). */
export async function saveTemplateFields(templateId, fields) {
  await ensureFirebaseSignedIn()
  await updateDoc(doc(getFirebaseDb(), TEMPLATES_COLLECTION, templateId), {
    fields,
    updatedAt: serverTimestamp(),
  })
}

/** Renames the test this template is linked to (used to match it during report generation). */
export async function renameTemplateTest(templateId, testName) {
  await ensureFirebaseSignedIn()
  await updateDoc(doc(getFirebaseDb(), TEMPLATES_COLLECTION, templateId), {
    testName,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTemplate(template) {
  await ensureFirebaseSignedIn()
  const storage = getFirebaseStorage()
  try {
    await deleteObject(ref(storage, template.storagePath))
  } catch {
    // Storage object may already be gone — the Firestore record is the
    // source of truth for the library, so don't block deletion on this.
  }
  await deleteDoc(doc(getFirebaseDb(), TEMPLATES_COLLECTION, template.id))
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
  const [{ PDFDocument, rgb, StandardFonts }] = await Promise.all([import('pdf-lib')])
  const bytes = await fetch(template.downloadURL).then((r) => r.arrayBuffer())
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

/** Uploads a generated (filled-in) report PDF to Firebase Storage and returns its public URL. */
export async function uploadGeneratedReportToFirebase(bookingId, blob) {
  await ensureFirebaseSignedIn()
  const storage = getFirebaseStorage()
  const path = `generated-reports/${bookingId}/${Date.now()}-report.pdf`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, blob, { contentType: 'application/pdf' })
  return getDownloadURL(fileRef)
}
