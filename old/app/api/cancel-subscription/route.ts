import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID da assinatura não fornecido' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ ok: true, subscription })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 })
  }
}
