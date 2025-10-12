import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const supabase = createClient()

    console.log('=== TESTANDO SINCRONIZAÇÃO CORRETA ===')

    // Buscar a assinatura mais recente no Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 404 })
    }

    const subscription = subscriptions.data[0]
    console.log('Assinatura encontrada:', subscription.id)
    console.log('Status:', subscription.status)
    console.log('Customer:', subscription.customer)

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

    // Determinar tipo de plano CORRETO
    const planType =
      subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

    console.log('Plan Type detectado:', planType)

    // Detectar Plus baseado no metadata da session
    let explicacaoPratica = false
    try {
      const sessions = await stripe.checkout.sessions.list({
        subscription: subscription.id,
        limit: 1,
      })

      if (sessions.data.length > 0) {
        const session = sessions.data[0]
        const metadata = session.metadata || {}
        const isPlus = metadata.isPlus === 'true' || metadata.isPlus === 'true'
        const planTypeMetadata = metadata.planType || ''

        explicacaoPratica = isPlus || planTypeMetadata.toLowerCase().includes('plus')
        console.log('Metadata da session:', metadata)
        console.log('Is Plus do metadata:', isPlus)
        console.log('Plan Type do metadata:', planTypeMetadata)
      }
    } catch (err) {
      console.log('Erro ao buscar session, usando detecção alternativa:', err)
    }

    // Fallback: detecção por price ID e nomes
    if (!explicacaoPratica) {
      const priceId = subscription.items.data[0]?.price?.id || ''
      const priceName = subscription.items.data[0]?.price?.nickname || ''

      explicacaoPratica =
        priceId.toLowerCase().includes('plus') || priceName.toLowerCase().includes('plus')
    }

    console.log('Explicação Prática detectada:', explicacaoPratica)

    // Datas CORRETAS
    const currentPeriodStart = (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000).toISOString()
      : null
    const currentPeriodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : null

    console.log('Current Period Start:', currentPeriodStart)
    console.log('Current Period End:', currentPeriodEnd)

    const subscriptionData = {
      user_id: profile.id,
      status: subscription.status,
      plan_type: planType as 'monthly' | 'yearly',
      price_id: subscription.items.data[0]?.price?.id || '',
      subscription_id: subscription.id,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      explicacao_pratica: explicacaoPratica,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log('=== DADOS CORRETOS PARA INSERÇÃO ===')
    console.log(JSON.stringify(subscriptionData, null, 2))

    const { data: insertResult, error: insertError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (insertError) {
      console.error('ERRO ao inserir assinatura:', insertError)
      return NextResponse.json({ error: 'Erro ao inserir assinatura' }, { status: 500 })
    }

    console.log('✅ Assinatura sincronizada com dados corretos:', insertResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada com dados corretos',
      data: insertResult,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
