import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const supabase = createClient()

    console.log('=== SINCRONIZAÇÃO MANUAL DA ASSINATURA ===')

    // Customer ID correto
    const customerId = 'cus_TDchuNP6TWPMSH'
    const userId = '4a5d37b9-fa2b-45f7-96c2-12a9fd766d3c'

    // Buscar assinatura no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    })

    console.log('Assinaturas encontradas no Stripe:', subscriptions.data.length)

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura encontrada no Stripe' },
        { status: 404 }
      )
    }

    const subscription = subscriptions.data[0]
    console.log('Processando assinatura:', subscription.id)
    console.log('Status:', subscription.status)

    // Determinar tipo de plano
    const planType =
      subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

    // Detectar se é Plus
    let explicacaoPratica = false
    const priceId = subscription.items.data[0]?.price?.id || ''
    const priceName = subscription.items.data[0]?.price?.nickname || ''

    explicacaoPratica =
      priceId.toLowerCase().includes('plus') || priceName.toLowerCase().includes('plus')

    // Se cancelar, explicacao_pratica deve ser false
    if (subscription.status === 'canceled') {
      explicacaoPratica = false
    }

    const subscriptionData = {
      user_id: userId,
      status: subscription.status,
      plan_type: planType as 'monthly' | 'yearly',
      price_id: priceId,
      subscription_id: subscription.id,
      current_period_start: (subscription as any).current_period_start
        ? new Date((subscription as any).current_period_start * 1000).toISOString()
        : null,
      current_period_end: (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      explicacao_pratica: explicacaoPratica,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log('=== INSERINDO ASSINATURA NO BANCO ===')
    console.log('Dados:', JSON.stringify(subscriptionData, null, 2))

    const { data: insertResult, error: insertError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (insertError) {
      console.error('ERRO ao inserir assinatura:', insertError)
      return NextResponse.json({ error: 'Erro ao inserir assinatura' }, { status: 500 })
    }

    console.log('✅ Assinatura inserida com sucesso:', insertResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada com sucesso',
      data: insertResult,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
