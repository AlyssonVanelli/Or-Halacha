import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reprocessEvents } from '@/lib/hotmart-events'

// Reaplica eventos da Hotmart que ficaram com erro (ex.: link de oferta faltando na Vercel).
//   curl -X POST https://www.or-halacha.com.br/api/admin/hotmart/reprocessar \
//     -H "Authorization: Bearer $ADMIN_SECRET_TOKEN" [-d '{"id":"<id do evento>"}']
export async function POST(req: Request) {
  const expected = process.env.ADMIN_SECRET_TOKEN
  if (!expected || req.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  const admin = createAdminClient()

  let query = admin
    .from('payment_events')
    .select('id, payload')
    .order('created_at', { ascending: true })
    .limit(100)
  query = id ? query.eq('id', id) : query.eq('status', 'error')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = await reprocessEvents(admin, data || [])
  return NextResponse.json({
    total: results.length,
    results: results.map(r => ({ id: r.id, status: r.status, item: r.item, error: r.error })),
  })
}
