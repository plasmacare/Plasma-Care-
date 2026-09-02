import { supabase } from '../../lib/supabase'

export async function fetchMyBulkRequests() {
  const { data, error } = await supabase
    .from('b2b_bulk_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitBulkRequest({ b2bAccountId, packageId, individualTestId, preferredDate, patients, notes }) {
  const { error } = await supabase.from('b2b_bulk_requests').insert({
    b2b_account_id: b2bAccountId,
    package_id: packageId || null,
    individual_test_id: individualTestId || null,
    preferred_date: preferredDate || null,
    patients,
    notes: notes || null,
  })
  if (error) throw error
}
