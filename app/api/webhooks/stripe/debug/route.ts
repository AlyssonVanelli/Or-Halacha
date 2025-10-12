import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log('=== WEBHOOK DEBUG CHAMADO ===')

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') as string

  console.log('=== DADOS RECEBIDOS ===')
  console.log('Body length:', body.length)
  console.log('Body completo:', body)
  console.log('Headers:', Object.fromEntries(headersList.entries()))

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('=== EVENTO STRIPE PROCESSADO ===')
    console.log('Event Type:', event.type)
    console.log('Event ID:', event.id)
    console.log('Event Created:', new Date(event.created * 1000).toISOString())
    console.log('Event Data COMPLETO:', JSON.stringify(event.data, null, 2))

    // Se for subscription, mostrar detalhes específicos
    if (event.type.includes('subscription')) {
      const subscription = event.data.object as Stripe.Subscription
      console.log('=== DETALHES DA SUBSCRIPTION ===')
      console.log('ID:', subscription.id)
      console.log('Status:', subscription.status)
      console.log('Customer:', subscription.customer)
      console.log('Current Period Start:', (subscription as any).current_period_start)
      console.log('Current Period End:', (subscription as any).current_period_end)
      console.log('Canceled At:', subscription.canceled_at)
      console.log('Cancel At Period End:', subscription.cancel_at_period_end)
      console.log('Items:', JSON.stringify(subscription.items, null, 2))
      console.log('Metadata:', JSON.stringify(subscription.metadata, null, 2))

      // Verificar se tem dados de período
      if ((subscription as any).current_period_start) {
        console.log(
          'Current Period Start (ISO):',
          new Date((subscription as any).current_period_start * 1000).toISOString()
        )
      }
      if ((subscription as any).current_period_end) {
        console.log(
          'Current Period End (ISO):',
          new Date((subscription as any).current_period_end * 1000).toISOString()
        )
      }

      // Verificar price_id
      if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price?.id
        console.log('Price ID:', priceId)
        console.log('É Plus?', priceId?.includes('plus') || priceId?.includes('Plus'))
      }
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('=== ERRO NA VERIFICAÇÃO DO WEBHOOK ===')
    console.error('Erro:', errorMessage)
    console.error('Body recebido:', body)
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }

  return NextResponse.json({ received: true, eventType: event.type })
}
