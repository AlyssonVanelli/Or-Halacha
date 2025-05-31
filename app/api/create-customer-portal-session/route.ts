import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 })
    }

    // Buscar o stripe_customer_id do perfil
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Cliente não encontrado no Stripe' }, { status: 404 })
    }

    // Criar sessão do portal do cliente no Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000/dashboard',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar sessão do portal' }, { status: 500 })
  }
}
