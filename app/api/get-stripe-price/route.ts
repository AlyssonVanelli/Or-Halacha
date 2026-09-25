import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { priceId } = await req.json()
    if (typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      return NextResponse.json({ error: 'priceId obrigatório' }, { status: 400 })
    }
    const price = await stripe.prices.retrieve(priceId)
    return NextResponse.json({ amount: (price.unit_amount || 0) / 100 })
  } catch (err: unknown) {
    console.error('Erro ao buscar preço:', err)
    return NextResponse.json({ error: 'Erro ao buscar preço' }, { status: 500 })
  }
}
