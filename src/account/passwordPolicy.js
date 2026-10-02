const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'qwerty123', 'qwertyuiop', '1234567890', '12345678910',
  'iloveyou123', 'welcome123', 'admin12345', 'letmein123', 'abc1234567', 'plasmacare', 'plasmacare1',
])

/** Returns '' if the password is acceptable, otherwise a short message saying what to fix. */
export function checkPassword(password, email = '') {
  if (password.length < 10) return 'Use at least 10 characters.'
  if (password.length > 128) return 'Use at most 128 characters.'
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  if (classes < 3) return 'Mix at least 3 of: lowercase, UPPERCASE, numbers, symbols.'
  const lower = password.toLowerCase()
  if (COMMON.has(lower)) return 'That password is too common. Pick something less guessable.'
  if (/^(.)\1+$/.test(password)) return 'Do not repeat a single character.'
  const local = email.split('@')[0]?.toLowerCase() || ''
  if (local.length >= 4 && lower.includes(local)) return 'Your password should not contain your email name.'
  return ''
}

export function passwordStrength(password) {
  let score = 0
  if (password.length >= 10) score += 1
  if (password.length >= 14) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score // 0-5
}
