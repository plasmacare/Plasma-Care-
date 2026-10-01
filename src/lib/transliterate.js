/**
 * Hindi (Devanagari) and Odia -> English (Latin) transliteration, fully
 * offline (no API, no cost). Used so a patient can fill the booking form
 * in Hindi/Odia while the admin/staff panel always reads English.
 *
 * This is TRANSLITERATION (sound-for-sound), which is what's right for
 * names and landmarks: "सुशांत" -> "Sushant", "ସୁଶାନ୍ତ" -> "Sushanta".
 * It is not meaning-translation. Spelling is a best-effort romanisation,
 * so the original text is always saved next to it (see
 * multilingual_and_customer_insights.sql) for staff to double-check.
 *
 * Odia's script is laid out in the same order as Devanagari (both come
 * from ISCII), so Odia text is shifted into the Devanagari block and
 * run through the same engine.
 */

const ODIA_START = 0x0b01
const ODIA_END = 0x0b7f
const ODIA_SHIFT = 0x200
const DEV_START = 0x0900
const DEV_END = 0x097f

const INDEPENDENT_VOWELS = {
  '\u0905': 'a', '\u0906': 'a', '\u0907': 'i', '\u0908': 'i', '\u0909': 'u', '\u090a': 'u',
  '\u090b': 'ri', '\u090f': 'e', '\u0910': 'ai', '\u0913': 'o', '\u0914': 'au',
  '\u090d': 'e', '\u0911': 'o', '\u090e': 'e', '\u0912': 'o',
}
const VOWEL_SIGNS = {
  '\u093e': 'a', '\u093f': 'i', '\u0940': 'i', '\u0941': 'u', '\u0942': 'u', '\u0943': 'ri',
  '\u0947': 'e', '\u0948': 'ai', '\u094b': 'o', '\u094c': 'au', '\u0945': 'e', '\u0949': 'o',
  '\u0946': 'e', '\u094a': 'o',
}
const CONSONANTS = {
  '\u0915': 'k', '\u0916': 'kh', '\u0917': 'g', '\u0918': 'gh', '\u0919': 'n',
  '\u091a': 'ch', '\u091b': 'chh', '\u091c': 'j', '\u091d': 'jh', '\u091e': 'n',
  '\u091f': 't', '\u0920': 'th', '\u0921': 'd', '\u0922': 'dh', '\u0923': 'n',
  '\u0924': 't', '\u0925': 'th', '\u0926': 'd', '\u0927': 'dh', '\u0928': 'n',
  '\u092a': 'p', '\u092b': 'ph', '\u092c': 'b', '\u092d': 'bh', '\u092e': 'm',
  '\u092f': 'y', '\u0930': 'r', '\u0932': 'l', '\u0933': 'l', '\u0935': 'v',
  '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's', '\u0939': 'h',
  // precomposed nukta letters
  '\u0958': 'q', '\u0959': 'kh', '\u095a': 'g', '\u095b': 'z', '\u095c': 'r', '\u095d': 'rh', '\u095e': 'f', '\u095f': 'y',
}
const NUKTA_OVERRIDE = { '\u0915': 'q', '\u0916': 'kh', '\u0917': 'g', '\u091c': 'z', '\u0921': 'r', '\u0922': 'rh', '\u092b': 'f' }
const VIRAMA = '\u094d'
const NUKTA = '\u093c'
const DIGITS_ASCII = { '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096a': '4', '\u096b': '5', '\u096c': '6', '\u096d': '7', '\u096e': '8', '\u096f': '9' }

const HAS_INDIC = /[\u0900-\u097f\u0b01-\u0b7f]/

/** Converts Hindi/Odia digits to 0-9. Safe on any string. */
export function normalizeDigits(str) {
  return String(str ?? '').replace(/[\u0966-\u096f\u0b66-\u0b6f]/g, (ch) => {
    const code = ch.charCodeAt(0)
    return String(code >= 0x0b66 ? code - 0x0b66 : code - 0x0966)
  })
}

function toDevanagariSpace(str) {
  let out = ''
  let odiaChars = 0
  let devChars = 0
  for (const ch of str) {
    const c = ch.codePointAt(0)
    if (c >= ODIA_START && c <= ODIA_END) odiaChars += 1
    else if (c >= DEV_START && c <= DEV_END) devChars += 1
  }
  const isOdia = odiaChars > devChars
  for (const ch of str) {
    const c = ch.codePointAt(0)
    if (c >= ODIA_START && c <= ODIA_END) {
      if (c === 0x0b71) out += '\u0935' // Odia wa
      else if (c === 0x0b2f) out += '\u200cJ' // Odia ya (ଯ) is read "j" in names; marker handled below
      else out += String.fromCodePoint(c - ODIA_SHIFT)
    } else out += ch
  }
  return { text: out, isOdia }
}

function transliterateWord(word, isOdia) {
  let out = ''
  // pendingA = true when the last thing written was a bare consonant
  // that carries the inherent "a" (which a virama/vowel sign may cancel).
  let pendingA = false
  const chars = Array.from(word)
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i]
    const isOdiaYa = ch === '\u200c' && chars[i + 1] === 'J' // Odia ଯ marker
    if (isOdiaYa) i += 1
    if (isOdiaYa || CONSONANTS[ch]) {
      let roman = isOdiaYa ? 'j' : CONSONANTS[ch]
      // व written after a virama (a conjunct like स्व, श्व) is read "w"
      if (ch === '\u0935' && chars[i - 1] === VIRAMA) roman = 'w'
      if (chars[i + 1] === NUKTA) {
        roman = NUKTA_OVERRIDE[ch] || roman
        i += 1
      }
      // ज्ञ is "gy" in Hindi, but the plain jny reading is fine for Odia
      if (!isOdia && ch === '\u091c' && chars[i + 1] === VIRAMA && chars[i + 2] === '\u091e') {
        out += 'gy'
        i += 2
        pendingA = true
        continue
      }
      out += roman
      pendingA = true
    } else if (ch === VIRAMA) {
      pendingA = false
    } else if (VOWEL_SIGNS[ch]) {
      out += VOWEL_SIGNS[ch]
      pendingA = false
    } else if (INDEPENDENT_VOWELS[ch]) {
      out += INDEPENDENT_VOWELS[ch]
      pendingA = false
    } else if (ch === '\u0902' || ch === '\u0901') { // anusvara / chandrabindu
      if (pendingA) { out += 'a'; pendingA = false }
      const next = chars[i + 1]
      out += !next || /[\u092a\u092b\u092c\u092d\u092e]/.test(next) ? 'm' : 'n'
    } else if (ch === '\u0903') {
      if (pendingA) { out += 'a'; pendingA = false }
      out += 'h'
    } else if (ch === NUKTA || ch === '\u093d') {
      // stray nukta / avagraha — ignore
    } else {
      if (pendingA) { out += 'a'; pendingA = false }
      out += DIGITS_ASCII[ch] ?? ch
    }
    // an inherent "a" is only written once we know the next thing isn't
    // a virama/vowel sign — handled lazily below
    const next = chars[i + 1]
    if (pendingA && next && !(next === VIRAMA || VOWEL_SIGNS[next] || next === NUKTA)) {
      // a following consonant/vowel/anusvara means this consonant keeps its "a"
      if (!(next === '\u0902' || next === '\u0901' || next === '\u0903')) {
        out += 'a'
        pendingA = false
      }
    }
  }
  if (pendingA) {
    // Word ends on a bare consonant. Names are almost always written
    // without the final schwa in English ("Kamal", "Sushant", "Das"),
    // so it's dropped — except for single-letter words.
    if (chars.length <= 1) out += 'a'
  }
  return out
}

/**
 * Returns an English (Latin-script) version of `text`. Text with no
 * Hindi/Odia characters is returned unchanged, so it is always safe to
 * call on any user input.
 */
export function toEnglish(text) {
  if (!text || !HAS_INDIC.test(text)) return text
  const { text: shifted, isOdia } = toDevanagariSpace(text)
  return shifted
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === '') return part
      const roman = transliterateWord(part, isOdia)
      return roman.charAt(0).toUpperCase() + roman.slice(1)
    })
    .join('')
}

export function hasIndicScript(text) {
  return !!text && HAS_INDIC.test(text)
}
