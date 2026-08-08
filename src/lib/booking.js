import { supabase } from './supabase'

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

export async function fetchTimeSlots(date) {
  // time_slots rows are per-date (slot_date), with booked_count tracked
  // directly on the row — no separate aggregation needed.
  const { data: slots, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('slot_date', date)
    .order('start_time', { ascending: true })
  if (error) throw error

  // max_capacity of 0 means unlimited (admin setting) — always available.
  return slots.filter((s) => s.max_capacity === 0 || (s.booked_count || 0) < s.max_capacity)
}

export async function createBooking({
  customerName,
  customerPhone,
  bookingType,
  selectedPackages,
  selectedTests,
  totalAmount,
  scheduledDate,
  slotId,
  address, // { fullAddress, landmark, latitude, longitude } | null
}) {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      booking_type: bookingType,
      selected_packages: selectedPackages,
      selected_tests: selectedTests,
      total_amount: totalAmount,
      scheduled_date: scheduledDate,
      slot_id: slotId,
      status: 'pending',
    })
    .select()
    .single()

  if (bookingError) throw bookingError

  // Atomically bump the slot's booked_count (a plain client-side
  // read-then-write here would race under concurrent bookings).
  const { error: slotError } = await supabase.rpc('increment_slot_booking', { p_slot_id: slotId })
  if (slotError) {
    // Booking already exists at this point — don't fail the whole flow
    // over a counter update; just log it for now.
    console.error('Could not update slot booked_count:', slotError)
  }

  if (bookingType === 'home_collection' && address) {
    const { error: addressError } = await supabase.from('addresses').insert({
      booking_id: booking.id,
      full_address: address.fullAddress,
      landmark: address.landmark || null,
      latitude: address.latitude,
      longitude: address.longitude,
    })
    if (addressError) throw addressError
  }

  return booking
}

export async function markBookingVerified(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({ phone_verified: true, status: 'confirmed' })
    .eq('id', bookingId)
  if (error) throw error
}
