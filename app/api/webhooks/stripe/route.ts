import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveStripeSubscription, toIso } from '@/lib/subscription-sync'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

type AdminClient = ReturnType<typeof createAdminClient>

async function handleInvoicePaid(supabase: AdminClient, invoice: Stripe.Invoice) {
  const inv = invoice as unknown as Record<string, unknown>
  const parent = inv['parent'] as { subscription_details?: { subscription?: string } } | undefined
  const subscriptionId =
    (inv['subscription'] as string | undefined) || parent?.subscription_details?.subscription
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const item = subscription.items.data[0]
  const sub = subscription as unknown as Record<string, unknown>

  // Atualiza apenas status e período. NÃO mexe em explicacao_pratica
  // (a versão anterior zerava o Plus a cada renovação).
  const update: Record<string, unknown> = {
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }
  const start = toIso(item?.current_period_start) || toIso(sub['current_period_start'])
  const end = toIso(item?.current_period_end) || toIso(sub['current_period_end'])
  if (start) update['current_period_start'] = start
  if (end) update['current_period_end'] = end

  const { data: rows, error } = await supabase
    .from('subscriptions')
    .update(update as never)
    .eq('subscription_id', subscriptionId)
    .select('id')

  if (error) {
    console.error('Webhook: erro ao atualizar assinatura pela invoice', error.message)
    throw new Error('Falha ao atualizar assinatura')
  }

  // Linha ainda não existe (evento de criação atrasado): cria a partir da assinatura
  if (!rows || rows.length === 0) {
    await saveStripeSubscription(stripe, supabase, subscription, true)
  }
}

async function handleCheckoutPaid(supabase: AdminClient, session: Stripe.Checkout.Session) {
  // Assinaturas são tratadas pelos eventos customer.subscription.*
  if (session.mode !== 'payment') return
  // Pagamentos assíncronos chegam depois via checkout.session.async_payment_succeeded
  if (session.payment_status !== 'paid') return

  const metadata = session.metadata || {}
  const { userId, divisionId, bookId: bookIdOrSlug } = metadata
  if (!userId || !divisionId || !bookIdOrSlug) {
    console.warn('Webhook: checkout de pagamento sem metadata de tratado', session.id)
    return
  }

  let bookId = bookIdOrSlug
  if (bookIdOrSlug === 'shulchan-aruch') {
    const { data: book, error } = await supabase
      .from('books')
      .select('id')
      .eq('slug', 'shulchan-aruch')
      .single()
    if (error || !book) {
      console.error('Webhook: livro shulchan-aruch não encontrado')
      throw new Error('Livro não encontrado')
    }
    bookId = book.id
  }

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  const { error } = await supabase.from('purchased_books').upsert(
    {
      user_id: userId,
      book_id: bookId,
      division_id: divisionId,
      expires_at: expiresAt.toISOString(),
      stripe_payment_intent_id: (session.payment_intent as string) || null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,division_id' }
  )

  if (error) {
    console.error('Webhook: erro ao registrar compra', session.id, error.message)
    throw new Error('Falha ao registrar compra')
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Assinatura do webhook ausente' }, { status: 400 })
  }

  const rawBody = Buffer.from(await req.arrayBuffer())

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook: assinatura inválida', (err as Error).message)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await saveStripeSubscription(
          stripe,
          supabase,
          event.data.object as Stripe.Subscription,
          event.type === 'customer.subscription.created'
        )
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutPaid(supabase, event.data.object as Stripe.Checkout.Session)
        break

      default:
        break
    }
  } catch (err) {
    console.error('Webhook: erro ao processar', event.type, event.id, err)
    // 500 faz o Stripe reenviar o evento
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
