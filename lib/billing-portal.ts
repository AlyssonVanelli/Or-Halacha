import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, getBaseUrl, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Abre o portal do Stripe SEMPRE para o customer do usuário autenticado.
// Qualquer customerId enviado pelo cliente é ignorado.
export async function createBillingPortalResponse() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil' })

    const { user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: profile } = await createAdminClient()
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Cliente não encontrado no Stripe' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getBaseUrl()}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if ((error as { code?: string }).code === 'resource_missing') {
      return NextResponse.json(
        { error: 'Nenhuma assinatura encontrada para esta conta.' },
        { status: 404 }
      )
    }
    console.error('Erro ao criar sessão do portal:', error)
    return NextResponse.json({ error: 'Erro ao criar sessão do portal' }, { status: 500 })
  }
}
