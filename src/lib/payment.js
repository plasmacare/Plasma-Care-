import { supabase } from './supabase'

/** Global payment rule set by admin — same for every customer, read once at the start of booking. */
export async function fetchPaymentSettings() {
  const { data, error } = await supabase.from('payment_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

/** Full amount, or the admin-configured percentage of it for partial payments. */
export function computeRequiredAmount(totalAmount, settings) {
  const full = Number(totalAmount) || 0
  if (settings?.payment_type === 'partial') {
    return Math.round((full * (Number(settings.partial_percentage) || 50)) / 100)
  }
  return full
}

/**
 * Creates the payment request for a just-created booking, right inline
 * in the booking flow — no separate admin step needed. For UPI, builds
 * the deep-link client-side. For Razorpay, calls the create-payment-link
 * Edge Function (same one the admin panel uses).
 */
export async function createPaymentRequest(booking, settings) {
  const amount = computeRequiredAmount(booking.total_amount ?? booking.totalAmount, settings)
  let link
  let razorpayPaymentLinkId = null

  if (settings.mode === 'razorpay') {
    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: {
        amount,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        description: `Plasma Care booking ${booking.id.slice(0, 8).toUpperCase()}`,
      },
    })
    if (error) throw error
    link = data.link
    razorpayPaymentLinkId = data.id
  } else {
    link =
      `upi://pay?pa=${encodeURIComponent(settings.upi_id)}&pn=${encodeURIComponent(settings.upi_payee_name || 'Plasma Care')}` +
      `&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(`Plasma Care ${booking.id.slice(0, 8).toUpperCase()}`)}`
  }

  const { error: saveError } = await supabase
    .from('bookings')
    .update({
      payment_requested_amount: amount,
      payment_method: settings.mode,
      payment_link: link,
      payment_status: 'requested',
      razorpay_payment_link_id: razorpayPaymentLinkId,
    })
    .eq('id', booking.id)
  if (saveError) throw saveError

  return { amount, method: settings.mode, link }
}

/** Turns a saved UPI deep-link (upi://...) into a scannable QR image — same public QR renderer the admin panel uses, no API key needed. */
export function upiLinkToQrImageUrl(upiLink) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`
}

export async function fetchBookingPayment(bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, customer_name, total_amount, payment_status, payment_method, payment_link, payment_requested_amount, payment_screenshot_url')
    .eq('id', bookingId)
    .single()
  if (error) throw error
  return data
}

/** Uploads proof-of-payment screenshot and marks the booking as awaiting confirmation. */
export async function uploadPaymentScreenshot(bookingId, file) {
  const path = `${bookingId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: true })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path)
  const { error } = await supabase
    .from('bookings')
    .update({ payment_screenshot_url: data.publicUrl, payment_status: 'screenshot_uploaded' })
    .eq('id', bookingId)
  if (error) throw error
  return data.publicUrl
}
