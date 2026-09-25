import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!subscription?.subscription_id) {
      return NextResponse.json(
        { error: 'Não foi possível reativar a assinatura. Tente novamente.' },
        { status: 400 }
      )
    }

    await stripe.subscriptions.update(subscription.subscription_id, {
      cancel_at_period_end: false,
    })

    await createAdminClient()
      .from('subscriptions')
      .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Assinatura reativada com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
