import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import type { Profile } from '@/lib/db'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

interface ProfileWithStripeId extends Profile {
  stripe_customer_id: string
}

export async function POST(req: Request) {
  const body = await req.json()
  const { priceId, userId, successUrl, cancelUrl, bookId, divisionId } = body

  if (!priceId) {
    return NextResponse.json({ error: 'PriceId não informado.' }, { status: 400 })
  }

  try {
    // Buscar o perfil do usuário
    const profile = await db.profiles.getById(userId)
    let stripeCustomerId = profile?.stripe_customer_id

    // Se não existir, criar o customer no Stripe e salvar no perfil
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: { userId },
      })
      stripeCustomerId = customer.id
      try {
        await db.profiles.update(userId, {
          stripe_customer_id: stripeCustomerId,
        } as ProfileWithStripeId)
      } catch (err) {}
    }

    // Buscar o price no Stripe para saber se é one-time ou recurring
    const price = await stripe.prices.retrieve(priceId)

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        ...(bookId && { bookId }),
        ...(divisionId && { divisionId }),
      },
    }

    if (price.type === 'recurring') {
      sessionConfig.mode = 'subscription'
    } else {
      sessionConfig.mode = 'payment'
    }

    sessionConfig.line_items = [
      {
        price: priceId,
        quantity: 1,
      },
    ]

    const session = await stripe.checkout.sessions.create(sessionConfig)
    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
