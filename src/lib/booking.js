import { supabase } from './supabase'
import { compressImage } from './imageCompress'

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

export async function createBooking({
  customerName,
  customerPhone,
  bookingType,
  selectedPackages,
  selectedTests,
  totalAmount,
  scheduledDate,
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

/** Uploads a (compressed) prescription photo and links it to the booking. */
export async function uploadPrescription(bookingId, file) {
  const compressed = await compressImage(file)
  const path = `${bookingId}/${Date.now()}-${compressed.name}`
  const { error: uploadError } = await supabase.storage.from('prescriptions').upload(path, compressed)
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('prescriptions').getPublicUrl(path)
  const { error } = await supabase.from('bookings').update({ prescription_url: data.publicUrl }).eq('id', bookingId)
  if (error) throw error
  return data.publicUrl
}

export async function markBookingVerified(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({ phone_verified: true, status: 'confirmed' })
    .eq('id', bookingId)
  if (error) throw error
}

export async function savePatientDetails(bookingId, { name, age, gender, bloodGroup }) {
  const { error } = await supabase
    .from('bookings')
    .update({
      patient_name: name || null,
      patient_age: age ? Number(age) : null,
      patient_gender: gender || null,
      patient_blood_group: bloodGroup || null,
    })
    .eq('id', bookingId)
  if (error) throw error
}


