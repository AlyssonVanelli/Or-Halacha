export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

function getNextShabbatDate() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  let daysUntilShabbat = (6 - dayOfWeek + 7) % 7 || 7
  if (dayOfWeek === 6) {
    daysUntilShabbat = 7
  }
  const nextShabbat = new Date(today)
  nextShabbat.setDate(today.getDate() + daysUntilShabbat)
  return nextShabbat.toISOString().slice(0, 10)
}

export async function GET() {
  const shabbatDate = getNextShabbatDate()
  const url = `https://www.hebcal.com/shabbat?cfg=json&geonameid=3469058&start=${shabbatDate}&end=${shabbatDate}`
  const res = await fetch(url)
  const data = await res.json()

  const items = Array.isArray((data as Record<string, unknown>)['items'])
    ? ((data as Record<string, unknown>)['items'] as Record<string, unknown>[])
    : []

  const parashaEvent = items.find(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'category' in item &&
      item['category'] === 'parashat'
  )

  const haftarahEvent = items.find(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'category' in item &&
      item['category'] === 'haftarah'
  )

  const specialReadings = items.filter(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'category' in item &&
      (item['category'] === 'holiday' || item['category'] === 'roshchodesh')
  )

  let haftarah =
    haftarahEvent &&
    typeof haftarahEvent === 'object' &&
    haftarahEvent !== null &&
    'title' in haftarahEvent
      ? (haftarahEvent['title'] as string)
      : ''

  const leyning =
    parashaEvent &&
    typeof parashaEvent === 'object' &&
    parashaEvent !== null &&
    'leyning' in parashaEvent
      ? parashaEvent['leyning']
      : undefined

  if (
    !haftarah &&
    leyning &&
    typeof leyning === 'object' &&
    leyning !== null &&
    'haftarah' in leyning
  ) {
    const haft = (leyning as { haftarah?: unknown })['haftarah']
    if (typeof haft === 'string') {
      haftarah = haft
    } else if (haft && typeof haft === 'object' && ('ashkenaz' in haft || 'sephardic' in haft)) {
      haftarah =
        (haft as { ashkenaz?: string; sephardic?: string })['ashkenaz'] ||
        (haft as { ashkenaz?: string; sephardic?: string })['sephardic'] ||
        ''
    }
  }

  const result = {
    nome:
      parashaEvent &&
      typeof parashaEvent === 'object' &&
      parashaEvent !== null &&
      'title' in parashaEvent
        ? (parashaEvent['title'] as string)
        : 'Parashá não encontrada',
    haftarah,
    leituraEspecial: specialReadings
      .map(item =>
        typeof item === 'object' && item !== null && 'title' in item ? item['title'] : ''
      )
      .join(', '),
  }

  return NextResponse.json(result)
}
