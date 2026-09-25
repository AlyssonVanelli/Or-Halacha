import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveStripeSubscription } from '@/lib/subscription-sync'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

// Sincroniza a assinatura do usuário autenticado logo após o checkout,
// caso o webhook ainda não tenha chegado. Ignora qualquer customerId enviado pelo cliente.
export async function POST() {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ success: true, count: 0 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      limit: 10,
    })

    // Prioriza a assinatura ativa/trial mais recente
    const sorted = [...subscriptions.data].sort((a, b) => b.created - a.created)
    const current = sorted.find(s => s.status === 'active' || s.status === 'trialing') || sorted[0]

    if (current) {
      await saveStripeSubscription(stripe, admin, current, false)
    }

    return NextResponse.json({
      success: true,
      message: 'Assinaturas sincronizadas',
      count: subscriptions.data.length,
    })
  } catch (error) {
    console.error('Erro ao sincronizar assinatura:', error)
    return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 })
  }
}
