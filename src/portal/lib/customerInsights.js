/**
 * Customer insights — builds one profile per BOOKER (identified by phone
 * number) and one per PATIENT (identified by name + gender), because the
 * person who books is often a family member of the person being tested.
 * Both are tracked, so a loyal son/daughter booking for a parent shows
 * up as a loyal booker, and the parent shows up as a patient with their
 * own history.
 *
 * "Successful" = the booking reached status "completed".
 *
 * GENUINE SCORE (0-100) — higher = more trustworthy / loyal:
 *   start at 50 (an unknown customer is neither good nor bad)
 *   +10 per completed booking (max +35)   -> proven customer
 *   +3  per extra completed repeat visit   -> loyalty (max +10)
 *   -12 per cancelled booking (max -36)
 *   -30 per booking an admin marked as spam
 *   -15 if the phone number is invalid / the name looks fake
 *   -10 if their IP is shared with 3+ different phone numbers
 *   -8  if they have 3+ bookings and none ever completed (no-shows)
 * Bands: 80+ Loyal · 60-79 Good · 40-59 New / unverified · under 40 Risky
 */

const SUSPICIOUS_NAME = /^(\d+|(.)\2{2,}|test|trial|xxx+|asdf|abc|demo)\d*$/i

function normName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function scoreBand(score) {
  if (score >= 80) return { label: 'Loyal', tone: 'good' }
  if (score >= 60) return { label: 'Good', tone: 'ok' }
  if (score >= 40) return { label: 'New / unverified', tone: 'neutral' }
  return { label: 'Risky', tone: 'bad' }
}

function summarize(bookings, ctx, { checkPhone }) {
  const home = bookings.filter((b) => b.booking_type === 'home_collection').length
  const lab = bookings.filter((b) => b.booking_type === 'lab_visit').length
  const successful = bookings.filter((b) => b.status === 'completed').length
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length
  const spam = bookings.filter((b) => b.is_spam).length
  const total = bookings.length

  let score = 50
  score += Math.min(35, successful * 10)
  score += Math.min(10, Math.max(0, successful - 1) * 3)
  score -= Math.min(36, cancelled * 12)
  score -= spam * 30

  const reasons = []
  if (successful > 0) reasons.push(`${successful} completed`)
  if (cancelled > 0) reasons.push(`${cancelled} cancelled`)
  if (spam > 0) reasons.push(`${spam} marked spam`)

  const sample = bookings[0]
  const badName = bookings.some((b) => SUSPICIOUS_NAME.test(normName(b.customer_name).replace(/\s+/g, '')))
  const badPatientName = bookings.some((b) => b.patient_name && SUSPICIOUS_NAME.test(normName(b.patient_name).replace(/\s+/g, '')))
  const badPhone = checkPhone && sample?.customer_phone && !/^[6-9]\d{9}$/.test(String(sample.customer_phone).replace(/\D/g, '').slice(-10))
  if (badPhone || badName || badPatientName) {
    score -= 15
    reasons.push(badPhone ? 'invalid phone number' : 'name looks fake')
  }

  const sharedIp = bookings.some((b) => b.customer_ip && (ctx.phonesByIp[b.customer_ip]?.size || 0) >= 3)
  if (sharedIp) {
    score -= 10
    reasons.push('IP shared with 3+ phone numbers')
  }
  if (total >= 3 && successful === 0) {
    score -= 8
    reasons.push('3+ bookings, none completed')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  return {
    total, home, lab, successful, cancelled, spam,
    score, band: scoreBand(score), reasons,
    lastBookedAt: bookings.reduce((m, b) => (b.created_at > m ? b.created_at : m), ''),
    bookings: [...bookings].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
  }
}

export function buildCustomerInsights(allBookings, { includeB2B = false } = {}) {
  const bookings = allBookings.filter((b) => includeB2B || !b.b2b_account_id)

  const phonesByIp = {}
  for (const b of bookings) {
    if (b.customer_ip && b.customer_phone) {
      ;(phonesByIp[b.customer_ip] ||= new Set()).add(b.customer_phone)
    }
  }
  const ctx = { phonesByIp }

  // Bookers — grouped by phone number
  const byPhone = new Map()
  for (const b of bookings) {
    const key = b.customer_phone || `no-phone-${b.id}`
    if (!byPhone.has(key)) byPhone.set(key, [])
    byPhone.get(key).push(b)
  }
  const bookers = [...byPhone.entries()].map(([phone, list]) => {
    const names = [...new Set(list.map((b) => (b.customer_name || '').trim()).filter(Boolean))]
    const patients = [...new Set(list.map((b) => (b.patient_name || '').trim()).filter(Boolean))]
    return {
      kind: 'booker',
      key: phone,
      name: names[0] || 'Unnamed',
      otherNames: names.slice(1),
      phone: phone.startsWith('no-phone-') ? '' : phone,
      related: patients, // patients this person has booked for
      ...summarize(list, ctx, { checkPhone: true }),
    }
  })

  // Patients — grouped by name + gender (patients have no phone of their own)
  const byPatient = new Map()
  for (const b of bookings) {
    const name = normName(b.patient_name)
    if (!name) continue
    const key = `${name}|${b.patient_gender || ''}`
    if (!byPatient.has(key)) byPatient.set(key, [])
    byPatient.get(key).push(b)
  }
  const patients = [...byPatient.entries()].map(([key, list]) => {
    const displayName = (list[0].patient_name || '').trim()
    const ages = [...new Set(list.map((b) => b.patient_age).filter((a) => a != null))]
    const bookedBy = [...new Set(list.map((b) => b.customer_phone).filter(Boolean))]
    return {
      kind: 'patient',
      key,
      name: displayName,
      gender: list[0].patient_gender || '',
      ages,
      phone: '',
      related: bookedBy, // phone numbers that booked for this patient
      ...summarize(list, ctx, { checkPhone: false }),
    }
  })

  const sortFn = (a, b) => b.total - a.total || b.score - a.score
  return { bookers: bookers.sort(sortFn), patients: patients.sort(sortFn) }
}
