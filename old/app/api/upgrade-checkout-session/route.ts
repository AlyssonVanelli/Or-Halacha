import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    const { subscriptionId, customerId, newPriceId } = await req.json()

    if (!subscriptionId || !customerId || !newPriceId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 1) Busca a subscription atual para pegar o item que será trocado
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 404 })
    }

    // 2) Atualiza a subscription diretamente via API
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: itemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
