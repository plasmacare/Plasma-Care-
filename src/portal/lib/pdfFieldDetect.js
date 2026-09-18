/**
 * Best-effort automatic field placement for the report-format library.
 * The supplied formats all come from the same "Labsmart" layout style —
 * a details block with "Age / Sex", "Referred by", "Reg. no.",
 * "Collected on", "Reported on" labels, followed by a TEST / VALUE /
 * UNIT / REFERENCE table. This reads the PDF's real text layer (not an
 * image) and places one field per known label, plus one per result row
 * (in the VALUE column only — units/reference ranges are static per
 * format and don't need overlaying).
 *
 * This is a starting point, not a guarantee: unusual layouts may need a
 * manual click to add/move a field afterwards in the mapper.
 */
export async function autoDetectFields(pdfUrl) {
  const pdfjsLib = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjsLib.getDocument(pdfUrl).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1 })
  const content = await page.getTextContent()

  const items = content.items
    .map((it) => {
      const [a, b, , , e, f] = pdfjsLib.Util.transform(viewport.transform, it.transform)
      return { str: (it.str || '').trim(), x: e, y: f, fontSize: Math.hypot(a, b) || 10 }
    })
    .filter((it) => it.str.length > 0)

  const width = viewport.width
  const height = viewport.height
  const fields = []

  function findLabel(regexList) {
    return items.find((it) => regexList.some((r) => r.test(it.str)))
  }

  function placeAfterLabel(label, key, fontSize = 10) {
    if (!label) return
    const x = label.x + label.str.length * (label.fontSize * 0.5) + 4
    fields.push({ key, xPct: Math.min(96, (x / width) * 100), yPct: (label.y / height) * 100, fontSize })
  }

  const ageSexLabel = findLabel([/age\s*\/\s*sex/i, /^age$/i])
  const referredLabel = findLabel([/referred\s*by/i, /ref\.?\s*by/i, /ref\.?\s*doctor/i])
  const regNoLabel = findLabel([/reg\.?\s*no/i])
  const registeredLabel = findLabel([/registered\s*on/i])
  const collectedLabel = findLabel([/collected\s*on/i])
  const reportedLabel = findLabel([/reported\s*on/i])

  placeAfterLabel(ageSexLabel, 'ageSex')
  placeAfterLabel(referredLabel, 'refDoctor')
  placeAfterLabel(regNoLabel, 'regNo')
  placeAfterLabel(registeredLabel, 'registeredOn')
  placeAfterLabel(collectedLabel, 'collectedOn')
  placeAfterLabel(reportedLabel, 'reportedOn')

  // Patient name: the nearest line of text directly above "Age / Sex",
  // on the left half of the page (avoids the reg-no/barcode block on
  // the right).
  if (ageSexLabel) {
    const above = items
      .filter((it) => it.y < ageSexLabel.y - 2 && it.x < width * 0.55)
      .sort((a, b) => b.y - a.y)[0]
    if (above) {
      fields.push({ key: 'patientName', xPct: (above.x / width) * 100, yPct: (above.y / height) * 100, fontSize: 11 })
    }
  }

  // Result table: one field per row, placed in the VALUE column only.
  const valueHeader = items.find((it) => /^value$/i.test(it.str))
  const unitHeader = items.find((it) => /^unit$/i.test(it.str))
  if (valueHeader) {
    const rightBound = unitHeader ? unitHeader.x - 4 : valueHeader.x + 120
    const rowYs = []
    items
      .filter((it) => it.y > valueHeader.y + 4)
      .forEach((it) => {
        if (!rowYs.some((y) => Math.abs(y - it.y) <= 3)) rowYs.push(it.y)
      })
    rowYs.sort((a, b) => a - b)

    rowYs.forEach((rowY) => {
      const rowItems = items.filter((it) => Math.abs(it.y - rowY) <= 3)
      const labelItems = rowItems.filter((it) => it.x < valueHeader.x - 4).sort((a, b) => a.x - b.x)
      const valueItems = rowItems.filter((it) => it.x >= valueHeader.x - 4 && it.x < rightBound)
      if (!labelItems.length || !valueItems.length) return
      const label = labelItems.map((it) => it.str).join(' ')
      if (/^(test|value|unit|reference)$/i.test(label)) return
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      if (!slug) return
      const target = valueItems[0]
      fields.push({
        key: `value_${slug}`,
        xPct: (target.x / width) * 100,
        yPct: (rowY / height) * 100,
        fontSize: Math.round(target.fontSize) || 9,
      })
    })
  }

  return fields
}
