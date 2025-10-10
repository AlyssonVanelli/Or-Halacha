import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json()
    if (!priceId) return NextResponse.json({ error: 'priceId obrigatório' }, { status: 400 })
    const price = await stripe.prices.retrieve(priceId)
    return NextResponse.json({ amount: (price.unit_amount || 0) / 100 })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
