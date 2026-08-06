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
  // time_slots is a reusable daily template (same 15 slots every day).
  // Availability per date is computed live from existing bookings —
  // no pre-generated rows needed for future dates.
  const { data: slots, error: slotsError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (slotsError) throw slotsError

  const { data: dayBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('slot_id')
    .eq('scheduled_date', date)
    .neq('status', 'cancelled')
  if (bookingsError) throw bookingsError

  const bookedCountBySlot = {}
  for (const b of dayBookings) {
    bookedCountBySlot[b.slot_id] = (bookedCountBySlot[b.slot_id] || 0) + 1
  }

  // max_capacity of 0 means unlimited (admin setting) — always available.
  return slots.filter((s) => {
    if (s.max_capacity === 0) return true
    const booked = bookedCountBySlot[s.id] || 0
    return booked < s.max_capacity
  })
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
