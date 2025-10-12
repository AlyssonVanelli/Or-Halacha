import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  console.log('=== VERIFICANDO STATUS DA ASSINATURA ===')

  const { customerId } = await req.json()

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID não fornecido' }, { status: 400 })
  }

  try {
    // Buscar assinaturas no Stripe (todas as assinaturas, não apenas ativas)
    console.log('Buscando assinaturas no Stripe para customer:', customerId)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    })

    console.log('Assinaturas encontradas no Stripe:', subscriptions.data.length)

    // Log detalhado de todas as assinaturas
    for (const sub of subscriptions.data) {
      console.log(`- Subscription ID: ${sub.id}, Status: ${sub.status}, Customer: ${sub.customer}`)
    }

    for (const subscription of subscriptions.data) {
      console.log('=== PROCESSANDO ASSINATURA DO STRIPE ===')
      console.log('Subscription ID:', subscription.id)
      console.log('Status:', subscription.status)
      console.log('Customer:', subscription.customer)
      console.log('Items:', subscription.items.data)

      // Buscar usuário no banco
      const supabase = createClient()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profileError || !profile) {
        console.error('ERRO: Profile não encontrado para customer:', customerId)
        continue
      }

      console.log('Profile encontrado:', profile.id)

      // Determinar tipo de plano baseado no interval
      const planType =
        subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

      // Detectar se é Plus baseado no metadata da session
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

      // Se cancelar, explicacao_pratica deve ser false
      if (subscription.status === 'canceled') {
        explicacaoPratica = false
      }

      console.log('Explicação Prática final:', explicacaoPratica)

      const subscriptionData = {
        user_id: profile.id,
        status: subscription.status,
        plan_type: planType as 'monthly' | 'yearly',
        price_id: subscription.items.data[0]?.price?.id || '',
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
      } else {
        console.log('SUCESSO! Assinatura inserida:', insertResult)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Assinaturas sincronizadas',
      count: subscriptions.data.length,
    })
  } catch (error) {
    console.error('ERRO ao buscar assinaturas:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar assinaturas',
      },
      { status: 500 }
    )
  }
}
