import { supabase } from '../../lib/supabase'

function formatLocalDate(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const ACTIVE_STATUSES = ['assigned', 'accepted', 'en_route', 'arrived']
const DONE_STATUSES = ['collected', 'declined']

async function myId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

export async function fetchMyJobs() {
  const id = await myId()
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('assigned_collector_id', id)
    .in('collection_status', ACTIVE_STATUSES)
    .order('scheduled_date', { ascending: true })
  if (error) throw error

  const ids = (bookings || []).map((b) => b.id)
  let addressesByBooking = {}
  if (ids.length) {
    const { data: addresses } = await supabase.from('addresses').select('*').in('booking_id', ids)
    addressesByBooking = Object.fromEntries((addresses || []).map((a) => [a.booking_id, a]))
  }
  return (bookings || []).map((b) => ({ ...b, address: addressesByBooking[b.id] || null }))
}

export async function fetchMyHistory() {
  const id = await myId()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('assigned_collector_id', id)
    .in('collection_status', DONE_STATUSES)
    .order('scheduled_date', { ascending: false })
    .limit(100)
  if (error) throw error
  return data || []
}

export async function updateCollectionStatus(bookingId, status) {
  const fields = { collection_status: status }
  // Once the collector actually has the sample in hand, the booking's
  // main status should reflect that too — staff shouldn't have to
  // separately remember to flip the status dropdown after every pickup.
  if (status === 'collected') {
    fields.status = 'sample_collected'
    // Backfills scheduled_date for older B2B bookings created before
    // registrations started setting it — a booking needs a non-null
    // date the moment its status leaves "pending", or this update gets
    // rejected by the database's own check constraint.
    const { data: existing } = await supabase.from('bookings').select('scheduled_date').eq('id', bookingId).single()
    if (existing && !existing.scheduled_date) {
      fields.scheduled_date = formatLocalDate(new Date())
    }
  }
  const { error } = await supabase.from('bookings').update(fields).eq('id', bookingId)
  if (error) throw error
}

export async function declineJob(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({ collection_status: 'unassigned', assigned_collector_id: null })
    .eq('id', bookingId)
  if (error) throw error
}

/** New-assignment alert — fires whenever a booking gets assigned_collector_id set to me. */
export function subscribeToMyNewJobs(onAssigned) {
  const channel = supabase
    .channel('collector-new-jobs')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, async (payload) => {
      const id = await myId()
      if (payload.new.assigned_collector_id === id && payload.new.collection_status === 'assigned') {
        onAssigned(payload.new)
      }
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
