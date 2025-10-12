import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const supabase = createClient()

    console.log('=== LIMPANDO CUSTOMERS DUPLICADOS ===')

    const userId = '4a5d37b9-fa2b-45f7-96c2-12a9fd766d3c'
    const correctCustomerId = 'cus_TDchuNP6TWPMSH'

    // 1. Atualizar o profile com o customer ID correto
    console.log('Atualizando profile com customer ID correto...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: correctCustomerId })
      .eq('id', userId)
      .select()

    if (profileError) {
      console.error('Erro ao atualizar profile:', profileError)
      return NextResponse.json({ error: 'Erro ao atualizar profile' }, { status: 500 })
    }

    console.log('✅ Profile atualizado:', profile)

    // 2. Buscar todas as assinaturas do customer correto
    console.log('Buscando assinaturas do customer correto...')
    const subscriptions = await stripe.subscriptions.list({
      customer: correctCustomerId,
      limit: 100,
    })

    console.log('Assinaturas encontradas:', subscriptions.data.length)

    // 3. Sincronizar a assinatura mais recente
    if (subscriptions.data.length > 0) {
      const latestSubscription = subscriptions.data[0] // Assumindo que a primeira é a mais recente

      console.log('Sincronizando assinatura mais recente:', latestSubscription.id)

      const planType =
        latestSubscription.items.data[0]?.price?.recurring?.interval === 'year'
          ? 'yearly'
          : 'monthly'
      const priceId = latestSubscription.items.data[0]?.price?.id || ''

      // Detectar se é Plus
      let explicacaoPratica = false
      const priceName = latestSubscription.items.data[0]?.price?.nickname || ''
      explicacaoPratica =
        priceId.toLowerCase().includes('plus') || priceName.toLowerCase().includes('plus')

      if (latestSubscription.status === 'canceled') {
        explicacaoPratica = false
      }

      const subscriptionData = {
        user_id: userId,
        status: latestSubscription.status,
        plan_type: planType as 'monthly' | 'yearly',
        price_id: priceId,
        subscription_id: latestSubscription.id,
        current_period_start: (latestSubscription as any).current_period_start
          ? new Date((latestSubscription as any).current_period_start * 1000).toISOString()
          : null,
        current_period_end: (latestSubscription as any).current_period_end
          ? new Date((latestSubscription as any).current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: latestSubscription.cancel_at_period_end,
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

      console.log('✅ Assinatura sincronizada:', insertResult)
    }

    return NextResponse.json({
      success: true,
      message: 'Customers duplicados limpos e assinatura sincronizada',
      customerId: correctCustomerId,
      subscriptionsCount: subscriptions.data.length,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
