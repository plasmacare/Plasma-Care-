import { supabase } from './supabase'
import { compressImage } from './imageCompress'
import { logEvent } from './telemetry'
import { toEnglish, hasIndicScript, normalizeDigits } from './transliterate'

export async function fetchPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchTests() {
  const { data, error } = await supabase
    .from('individual_tests')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
  if (error) throw error
  return data
}

const IP_CACHE_KEY = 'pc_client_ip'

function fetchWithTimeout(url, ms = 3500) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

const IP_VALID = /^[0-9a-fA-F:.]{7,45}$/

/**
 * Looks up the customer's public IP. Tries several free providers in
 * turn (any single one can be blocked by an ad-blocker, a firewall, or
 * a rate limit — that's why IPs were often coming back empty), and
 * caches the result for the browser session. Never throws.
 */
async function fetchClientIp() {
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY)
    if (cached) return cached
  } catch { /* storage blocked — carry on */ }

  const providers = [
    async () => (await (await fetchWithTimeout('https://api.ipify.org?format=json')).json()).ip,
    async () => {
      const text = await (await fetchWithTimeout('https://www.cloudflare.com/cdn-cgi/trace')).text()
      return /^ip=(.+)$/m.exec(text)?.[1]?.trim()
    },
    async () => (await (await fetchWithTimeout('https://api64.ipify.org?format=json')).json()).ip,
    async () => (await (await fetchWithTimeout('https://ipapi.co/json/')).json()).ip,
  ]
  // All providers in parallel, first valid answer wins — so one blocked
  // or slow provider can't hold up the booking.
  try {
    const ip = await Promise.any(providers.map(async (lookup) => {
      const value = await lookup()
      if (!value || !IP_VALID.test(value)) throw new Error('bad ip')
      return value
    }))
    try { sessionStorage.setItem(IP_CACHE_KEY, ip) } catch { /* ignore */ }
    return ip
  } catch {
    // every provider failed
  }
  // Not fatal — spam detection just has one less signal for this booking.
  return null
}

export async function createBooking({
  customerName,
  customerPhone,
  bookingType,
  selectedPackages,
  selectedTests,
  totalAmount,
  scheduledDate,
  address, // { fullAddress, landmark, latitude, longitude } | null
  verificationId,
  bookedViaSeniorAssistant = false,
}) {
  const customerIp = await fetchClientIp()

  // Customers can fill the form in Hindi/Odia; staff always read English.
  // The text they actually typed is kept alongside (only when it differs)
  // so staff can double-check a spelling.
  const originalName = (customerName || '').trim()
  const englishName = toEnglish(originalName)
  customerPhone = normalizeDigits(customerPhone).replace(/\D/g, '').slice(-10)
  if (address) {
    const landmark = (address.landmark || '').trim()
    const englishLandmark = toEnglish(landmark)
    address = {
      ...address,
      fullAddress: toEnglish(address.fullAddress || ''),
      landmark: englishLandmark,
      landmarkOriginal: hasIndicScript(landmark) ? landmark : null,
    }
  }
  // Generated here (not read back from the DB) because the anon role no
  // longer has SELECT on bookings — see secure_public_booking_access.sql.
  // We already know every field we're inserting, so there's nothing to
  // read back; this also means insert() no longer needs .select().
  const id = crypto.randomUUID()

  const { error: bookingError } = await supabase.from('bookings').insert({
    id,
    customer_name: englishName,
    ...(hasIndicScript(originalName) ? { customer_name_original: originalName } : {}),
    customer_phone: customerPhone,
    booking_type: bookingType,
    selected_packages: selectedPackages,
    selected_tests: selectedTests,
    total_amount: totalAmount,
    scheduled_date: scheduledDate,
    customer_ip: customerIp,
    status: 'pending',
    verification_id: verificationId || null,
    booked_via_senior_assistant: !!bookedViaSeniorAssistant,
  })

  if (bookingError) throw bookingError

  if (bookingType === 'home_collection' && address) {
    const { error: addressError } = await supabase.from('addresses').insert({
      booking_id: id,
      full_address: address.fullAddress,
      landmark: address.landmark || null,
      ...(address.landmarkOriginal ? { landmark_original: address.landmarkOriginal } : {}),
      latitude: address.latitude,
      longitude: address.longitude,
    })
    if (addressError) throw addressError
  }

  logEvent({
    type: 'booking_created',
    source: 'customer',
    message: `New booking: ${bookingType}`,
    metadata: { booking_id: id, total_amount: totalAmount },
  })

  return {
    id,
    customer_name: englishName,
    customer_phone: customerPhone,
    booking_type: bookingType,
    selected_packages: selectedPackages,
    selected_tests: selectedTests,
    total_amount: totalAmount,
    scheduled_date: scheduledDate,
    status: 'pending',
  }
}

/** Uploads a (compressed) prescription photo and links it to the booking. */
export async function uploadPrescription(bookingId, file) {
  const compressed = await compressImage(file)
  const path = `${bookingId}/${Date.now()}-${compressed.name}`
  const { error: uploadError } = await supabase.storage.from('prescriptions').upload(path, compressed)
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('prescriptions').getPublicUrl(path)
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: { prescription_url: data.publicUrl },
  })
  if (error) throw error
  return data.publicUrl
}

/** Records why a prescription upload failed so admin can see it and follow up, instead of the booking just quietly missing a photo. */
export async function savePrescriptionUploadError(bookingId, message) {
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: { prescription_upload_error: message || null },
  })
  if (error) throw error
}

export async function savePatientDetails(bookingId, { name, age, gender, bloodGroup }) {
  const originalName = (name || '').trim()
  const englishName = toEnglish(originalName)
  const cleanAge = normalizeDigits(age).replace(/\D/g, '')
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: {
      patient_name: englishName || null,
      // only sent when the patient typed in Hindi/Odia — the database
      // function ignores keys it doesn't know, so this is safe before
      // the new SQL file has been run
      ...(hasIndicScript(originalName) ? { patient_name_original: originalName } : {}),
      patient_age: cleanAge ? Number(cleanAge) : null,
      patient_gender: gender || null,
      patient_blood_group: bloodGroup || null,
    },
  })
  if (error) throw error
}

/**
 * Sends a (compressed) prescription photo to the analyze-prescription
 * edge function along with the current catalog, and gets back a read of
 * what's written plus suggested related tests. Callers should only act
 * on the result (pre-selecting tests) when confidence >= 99 — anything
 * lower and the customer should just pick tests manually.
 */
export async function analyzePrescription(file) {
  const compressed = await compressImage(file)
  const base64 = await fileToBase64(compressed)
  const [{ data: tests }, { data: packages }] = await Promise.all([
    supabase.from('individual_tests').select('id, name').eq('is_active', true),
    supabase.from('packages').select('id, name').eq('is_active', true),
  ])

  const { data, error } = await supabase.functions.invoke('analyze-prescription', {
    body: { imageBase64: base64, mediaType: compressed.type, tests, packages },
  })
  if (error) throw error
  return data
}

export async function savePrescriptionAiResult(bookingId, { confidence, summary }) {
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: { prescription_ai_confidence: confidence ?? null, prescription_ai_summary: summary || null },
  })
  if (error) throw error
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
