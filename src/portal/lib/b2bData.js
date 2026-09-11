import { supabase } from '../../lib/supabase'

export async function fetchMyBulkRequests() {
  const { data, error } = await supabase
    .from('b2b_bulk_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// One registration = one patient, one booking, with one or more tests
// each carrying its own collection time. Creates the real `bookings`
// row immediately (booking_type='home_collection', so it enters the
// same collection-staff dispatch flow as any other home-collection
// booking) — no separate admin "accept" step, since the company was
// already vetted when their access request was approved. The
// `b2b_bulk_requests` row is kept purely as a record for the company's
// own History page.
export async function submitRegistration({ b2bAccountId, name, age, gender, phone, tests, notes }) {
  const { data: account, error: acctErr } = await supabase
    .from('b2b_accounts')
    .select('company_name, phone, address, latitude, longitude')
    .eq('id', b2bAccountId)
    .single()
  if (acctErr) throw acctErr

  const selectedPackages = tests.filter((t) => t.package_id).map((t) => t.package_id)
  const selectedTests = tests.filter((t) => t.individual_test_id).map((t) => t.individual_test_id)
  const totalAmount = tests.reduce((sum, t) => sum + (t.price || 0), 0)

  const timesNote = tests.map((t) => `${t.test_label} at ${t.time}`).join(', ')
  const combinedNotes = [timesNote ? `Sample collection times — ${timesNote}` : null, notes || null]
    .filter(Boolean)
    .join(' — ')

  const patientRecord = { name, age, gender, phone, tests }

  const { data: batch, error: batchErr } = await supabase
    .from('b2b_bulk_requests')
    .insert({
      b2b_account_id: b2bAccountId,
      patients: [patientRecord],
      notes: notes || null,
      status: 'submitted',
      bookings_created: true,
    })
    .select('id')
    .single()
  if (batchErr) throw batchErr

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      customer_name: name,
      customer_phone: phone || account.phone || '',
      booking_type: 'home_collection',
      selected_packages: selectedPackages,
      selected_tests: selectedTests,
      total_amount: totalAmount,
      scheduled_date: null,
      status: 'pending',
      patient_name: name,
      patient_age: age ? Number(age) : null,
      patient_gender: gender ? gender.toLowerCase() : null,
      b2b_bulk_request_id: batch.id,
      b2b_account_id: b2bAccountId,
      admin_notes: combinedNotes || null,
    })
    .select('id')
    .single()
  if (bookingErr) throw bookingErr

  if (account.address) {
    await supabase.from('addresses').insert({
      booking_id: booking.id,
      full_address: account.address,
      latitude: account.latitude,
      longitude: account.longitude,
    })
  }
}

/** For the B2B company's own History page — live status/report link for the booking created from a registration. */
export async function fetchBookingsForBulkRequest(bulkRequestId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, patient_name, status, report_status, report_url')
    .eq('b2b_bulk_request_id', bulkRequestId)
  if (error) throw error
  return data || []
}
