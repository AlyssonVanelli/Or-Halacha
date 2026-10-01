import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hottokMatches } from '@/lib/hotmart'
import {
  parseHotmartEvent,
  processHotmartEvent,
  sanitizePayload,
  saveResult,
} from '@/lib/hotmart-events'

// Webhook 2.0 da Hotmart (Ferramentas → Webhook → URL deste endpoint, todos os eventos de
// compra e de assinatura). Responder 200 confirma o recebimento; 5xx faz a Hotmart reenviar.
export async function POST(req: Request) {
  if (!process.env.HOTMART_HOTTOK) {
    console.error('Webhook Hotmart: HOTMART_HOTTOK não configurado')
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 503 })
  }
  if (!hottokMatches(req.headers.get('x-hotmart-hottok'))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const ev = parseHotmartEvent(body)
  if (!ev) return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })

  const admin = createAdminClient()

  // Idempotência: a Hotmart pode reenviar o mesmo evento
  const { data: existing, error: readError } = await admin
    .from('payment_events')
    .select('status')
    .eq('id', ev.id)
    .maybeSingle()
  if (readError) {
    console.error('Webhook Hotmart: erro ao ler payment_events', readError.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
  if (existing && existing.status !== 'error' && existing.status !== 'received') {
    return NextResponse.json({ received: true, duplicate: true })
  }

  if (!existing) {
    const { error: insertError } = await admin.from('payment_events').insert({
      id: ev.id,
      provider: 'hotmart',
      event: ev.event,
      status: 'received',
      buyer_email: ev.buyerEmail,
      transaction_id: ev.transaction,
      subscriber_code: ev.subscriberCode,
      amount: ev.amount,
      currency: ev.currency,
      payload: sanitizePayload(body),
    })
    if (insertError) {
      // Mesmo evento chegando em paralelo
      if (insertError.code === '23505')
        return NextResponse.json({ received: true, duplicate: true })
      console.error('Webhook Hotmart: erro ao gravar evento', insertError.message)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  }

  try {
    const result = await processHotmartEvent(admin, ev)
    await saveResult(admin, ev.id, result)
    if (result.status === 'error') {
      // Configuração (oferta desconhecida): fica registrado para reprocessar depois do ajuste
      console.error('Webhook Hotmart:', ev.event, ev.id, result.error)
    }
    return NextResponse.json({ received: true, status: result.status })
  } catch (err) {
    console.error('Webhook Hotmart: erro ao processar', ev.event, ev.id, err)
    await saveResult(admin, ev.id, { status: 'error', error: (err as Error).message })
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }
}
