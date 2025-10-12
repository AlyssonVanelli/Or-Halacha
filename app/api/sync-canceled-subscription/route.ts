import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const supabase = createClient()

    console.log('=== SINCRONIZANDO ASSINATURA CANCELADA ===')

    const subscriptionId = 'sub_1SHBl5FLuMsSi0YiFYOTs2mV'

    // Buscar a assinatura no Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    console.log('Status no Stripe:', subscription.status)
    console.log('Canceled At:', subscription.canceled_at)
    console.log('Ended At:', subscription.ended_at)

    // Buscar o profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile não encontrado' }, { status: 404 })
    }

    console.log('Profile encontrado:', profile.id)

    // Atualizar para CANCELED
    const { data: result, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        explicacao_pratica: false, // Cancelar remove Plus
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId)
      .select()

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 })
    }

    console.log('✅ Assinatura cancelada no banco:', result)

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada sincronizada',
      data: result,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
