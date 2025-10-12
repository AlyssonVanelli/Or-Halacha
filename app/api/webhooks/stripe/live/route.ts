import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log('\n🔥🔥🔥 WEBHOOK STRIPE CHAMADO - LOGS EM TEMPO REAL 🔥🔥🔥')
  console.log('⏰ TIMESTAMP:', new Date().toISOString())
  console.log('🌐 URL:', req.url)
  console.log('📝 METHOD:', req.method)
  console.log('='.repeat(80))

  const supabase = createClient()
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') as string

  console.log('🔐 SIGNATURE PRESENTE:', !!signature)
  console.log('📏 BODY LENGTH:', body.length)
  console.log('📄 BODY PREVIEW:', body.substring(0, 300) + '...')
  console.log('📋 HEADERS:', Object.fromEntries(headersList.entries()))

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('\n✅ EVENTO STRIPE PROCESSADO COM SUCESSO')
    console.log('🎯 EVENT TYPE:', event.type)
    console.log('🆔 EVENT ID:', event.id)
    console.log('📅 EVENT CREATED:', new Date(event.created * 1000).toISOString())
    console.log('📊 EVENT DATA:', JSON.stringify(event.data, null, 2))
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    console.log('\n❌❌❌ ERRO NA VERIFICAÇÃO DO WEBHOOK ❌❌❌')
    console.log('🚨 ERRO:', errorMessage)
    console.log('📄 BODY RECEBIDO:', body)
    console.log('='.repeat(80))
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }

  // Processar eventos de subscription
  if (event.type.includes('subscription')) {
    console.log('\n🔄 PROCESSANDO EVENTO DE SUBSCRIPTION')
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    console.log('👤 CUSTOMER ID:', customerId)
    console.log('🆔 SUBSCRIPTION ID:', subscription.id)
    console.log('📊 STATUS:', subscription.status)
    console.log('❌ CANCELED AT:', subscription.canceled_at)
    console.log('⏰ CANCEL AT PERIOD END:', subscription.cancel_at_period_end)
    console.log('📅 CURRENT PERIOD START:', (subscription as any).current_period_start)
    console.log('📅 CURRENT PERIOD END:', (subscription as any).current_period_end)

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    console.log('👤 PROFILE ENCONTRADO:', !!profile)
    if (profileError) {
      console.log('❌ ERRO AO BUSCAR PROFILE:', profileError)
    }

    if (profileError || !profile) {
      console.log('❌❌❌ PROFILE NÃO ENCONTRADO - PARANDO PROCESSAMENTO ❌❌❌')
      console.log('='.repeat(80))
      return NextResponse.json({ received: true })
    }

    // Determinar status final
    let finalStatus = subscription.status

    if (
      event.type === 'customer.subscription.deleted' ||
      subscription.status === 'canceled' ||
      subscription.canceled_at
    ) {
      finalStatus = 'canceled'
      console.log('\n🚨🚨🚨 CANCELAMENTO DETECTADO 🚨🚨🚨')
      console.log('🎯 EVENT TYPE:', event.type)
      console.log('📊 STATUS:', subscription.status)
      console.log('❌ CANCELED AT:', subscription.canceled_at)
      console.log('⏰ CANCEL AT PERIOD END:', subscription.cancel_at_period_end)
    }

    console.log('\n📊 STATUS FINAL:', finalStatus)

    // Detectar Plus e Plan Type
    const priceId = subscription.items.data[0]?.price?.id || ''
    const interval = subscription.items.data[0]?.price?.recurring?.interval

    console.log('=== DETECÇÃO DE PLANO ===')
    console.log('Price ID:', priceId)
    console.log('Interval:', interval)

    // Detecção mais robusta do plan_type
    let planType = 'monthly' // default

    // Priorizar detecção por interval do Stripe
    if (interval === 'year') {
      planType = 'yearly'
      console.log('✅ Detectado como yearly pelo interval do Stripe')
    } else if (interval === 'month') {
      planType = 'monthly'
      console.log('✅ Detectado como monthly pelo interval do Stripe')
    } else {
      // Fallback: detectar por price ID com mais precisão
      if (priceId) {
        console.log('🔍 Usando fallback por price ID:', priceId)

        // Detectar por padrões no price ID
        if (
          priceId.includes('anual') ||
          priceId.includes('yearly') ||
          priceId.includes('year') ||
          priceId.includes('annual') ||
          priceId.includes('year')
        ) {
          planType = 'yearly'
          console.log('✅ Detectado como yearly pelo price ID')
        } else if (
          priceId.includes('mensal') ||
          priceId.includes('monthly') ||
          priceId.includes('month')
        ) {
          planType = 'monthly'
          console.log('✅ Detectado como monthly pelo price ID')
        } else {
          // Último fallback: detectar por valor se disponível
          console.log('⚠️ Usando fallback por valor (não implementado)')
        }
      }
    }

    console.log('Plan Type detectado:', planType)

    const isPlusSubscription =
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'

    console.log('💎 É ASSINATURA PLUS?', isPlusSubscription)
    console.log('💰 PRICE ID:', priceId)

    // Criar dados da assinatura
    const subscriptionData = {
      user_id: profile.id,
      status: finalStatus as
        | 'active'
        | 'trialing'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid',
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
      explicacao_pratica: isPlusSubscription,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log('\n💾 DADOS DA ASSINATURA:')
    console.log(JSON.stringify(subscriptionData, null, 2))

    // Inserir/atualizar no banco
    console.log('\n🔄 INSERINDO/ATUALIZANDO NO BANCO...')

    const { data: insertResult, error: insertError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (insertError) {
      console.log('\n❌❌❌ ERRO AO INSERIR/ATUALIZAR ❌❌❌')
      console.log('🚨 ERRO:', insertError)
      console.log('📊 CÓDIGO:', insertError.code)
      console.log('💬 MENSAGEM:', insertError.message)
      console.log('🔍 DETALHES:', insertError.details)
      console.log('💡 HINT:', insertError.hint)
    } else {
      console.log('\n✅✅✅ SUCESSO! ASSINATURA INSERIDA/ATUALIZADA ✅✅✅')
      console.log('📊 RESULTADO:', JSON.stringify(insertResult, null, 2))
      console.log('📈 REGISTROS AFETADOS:', insertResult?.length || 0)
    }
  } else {
    console.log('\n⚠️ EVENTO NÃO TRATADO:', event.type)
    console.log('📊 DADOS:', JSON.stringify(event.data, null, 2))
  }

  console.log('\n🏁 WEBHOOK PROCESSADO COM SUCESSO')
  console.log('='.repeat(80))
  return NextResponse.json({ received: true })
}
