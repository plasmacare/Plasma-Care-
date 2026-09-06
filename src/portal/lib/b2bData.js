import { supabase } from '../../lib/supabase'

export async function fetchMyBulkRequests() {
  const { data, error } = await supabase
    .from('b2b_bulk_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// patients: [{ name, age, gender, phone, package_id, individual_test_id, test_label }, ...]
// Each patient carries their own test/package now — a batch can mix
// different tests per person, so nothing at the request level forces
// one test for the whole company.
export async function submitBulkRequest({ b2bAccountId, preferredDate, patients, notes }) {
  const { error } = await supabase.from('b2b_bulk_requests').insert({
    b2b_account_id: b2bAccountId,
    preferred_date: preferredDate || null,
    patients,
    notes: notes || null,
  })
  if (error) throw error
}

// ---------- Admin/staff side ----------

export async function fetchAllBulkRequests() {
  const { data, error } = await supabase
    .from('b2b_bulk_requests')
    .select('*, b2b_accounts(company_name, contact_name, phone, email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateBulkRequestStatus(id, status) {
  const { error } = await supabase.from('b2b_bulk_requests').update({ status }).eq('id', id)
  if (error) throw error
}

/**
 * Converts every patient in a bulk order into a real row in `bookings` —
 * the same table normal customer bookings live in. This is what makes a
 * bulk order show up and behave like a normal booking afterward (status
 * workflow, collection assignment, report generation). Safe to call only
 * once per order — the caller should check `bookings_created` first.
 */
export async function convertBulkRequestToBookings(order) {
  const [{ data: packages }, { data: tests }] = await Promise.all([
    supabase.from('packages').select('id, price'),
    supabase.from('individual_tests').select('id, price'),
  ])
  const priceById = new Map([
    ...(packages || []).map((p) => [p.id, p.price]),
    ...(tests || []).map((t) => [t.id, t.price]),
  ])

  const createdIds = []
  for (const patient of order.patients || []) {
    const selectedPackages = patient.package_id ? [patient.package_id] : []
    const selectedTests = patient.individual_test_id ? [patient.individual_test_id] : []
    const priceKey = patient.package_id || patient.individual_test_id
    const totalAmount = priceKey ? priceById.get(priceKey) || 0 : 0

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_name: order.b2b_accounts?.company_name || patient.name,
        customer_phone: patient.phone || order.b2b_accounts?.phone || '',
        booking_type: 'lab_visit',
        selected_packages: selectedPackages,
        selected_tests: selectedTests,
        total_amount: totalAmount,
        scheduled_date: order.preferred_date || null,
        status: 'confirmed',
        patient_name: patient.name,
        patient_age: patient.age ? Number(patient.age) : null,
        patient_gender: patient.gender ? patient.gender.toLowerCase() : null,
        b2b_bulk_request_id: order.id,
        b2b_account_id: order.b2b_account_id,
        admin_notes: order.notes || null,
      })
      .select('id')
      .single()
    if (error) throw error
    createdIds.push(booking.id)
  }

  const { error: updateErr } = await supabase
    .from('b2b_bulk_requests')
    .update({ status: 'processing', bookings_created: true })
    .eq('id', order.id)
  if (updateErr) throw updateErr

  return createdIds
}

/** For the B2B company's own History page — report status/links for bookings that came from their converted bulk orders. */
export async function fetchBookingsForBulkRequest(bulkRequestId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, patient_name, status, report_status, report_url')
    .eq('b2b_bulk_request_id', bulkRequestId)
  if (error) throw error
  return data || []
}
