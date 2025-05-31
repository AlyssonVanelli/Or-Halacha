import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Cria sessão do Customer Portal para o usuário gerenciar a assinatura
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    })

    // Retorna a URL do portal para redirecionamento
    return NextResponse.json({ url: portalSession.url })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
