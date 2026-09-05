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
