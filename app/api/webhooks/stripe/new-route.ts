import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log('=== NOVO WEBHOOK STRIPE - ABORDAGEM COMPLETAMENTE NOVA ===')

  const supabase = createClient()
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error('Erro na verificação do webhook:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  console.log('=== PROCESSANDO EVENTO ===')
  console.log('Tipo:', event.type)
  console.log('ID:', event.id)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event, supabase)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event, supabase)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailure(event, supabase)
        break

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleSubscriptionEvent(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('=== PROCESSANDO ASSINATURA ===')
  console.log('Subscription ID:', subscription.id)
  console.log('Status:', subscription.status)
  console.log('Customer:', subscription.customer)

  // Buscar usuário pelo customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .maybeSingle()

  if (profileError || !profile) {
    console.error('Usuário não encontrado para customer:', subscription.customer)
    return
  }

  console.log('Usuário encontrado:', profile.id)

  // Determinar tipo de plano
  const priceId = subscription.items.data[0]?.price?.id || ''
  const isPlus =
    priceId.includes('plus') ||
    priceId.includes('Plus') ||
    priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'
  const planType = priceId.includes('monthly') || priceId.includes('mensal') ? 'monthly' : 'yearly'

  console.log('=== DETECÇÃO DE PLANO ===')
  console.log('Price ID:', priceId)
  console.log('É Plus:', isPlus)
  console.log('Plan Type:', planType)

  // Preparar dados da assinatura
  const subscriptionData = {
    user_id: profile.id,
    status: subscription.status as any,
    plan_type: planType,
    price_id: priceId,
    subscription_id: subscription.id,
    current_period_start: (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000).toISOString()
      : new Date().toISOString(),
    current_period_end: (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : new Date(
          Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    explicacao_pratica: isPlus,
    updated_at: new Date().toISOString(),
  }

  console.log('=== INSERINDO/ATUALIZANDO ASSINATURA ===')
  console.log('Dados:', subscriptionData)

  const { data: result, error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()

  if (upsertError) {
    console.error('ERRO ao salvar assinatura:', upsertError)
    throw upsertError
  }

  console.log('SUCESSO! Assinatura salva:', result)
}

async function handleSubscriptionCancellation(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('=== PROCESSANDO CANCELAMENTO ===')
  console.log('Subscription ID:', subscription.id)
  console.log('Status:', subscription.status)

  // Buscar usuário pelo customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .maybeSingle()

  if (profileError || !profile) {
    console.error('Usuário não encontrado para customer:', subscription.customer)
    return
  }

  console.log('Usuário encontrado:', profile.id)

  // Atualizar status para canceled
  const { data: result, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)
    .select()

  if (updateError) {
    console.error('ERRO ao cancelar assinatura:', updateError)
    throw updateError
  }

  console.log('SUCESSO! Assinatura cancelada:', result)
}

async function handlePaymentSuccess(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  console.log('=== PROCESSANDO PAGAMENTO SUCESSO ===')
  console.log('Invoice ID:', invoice.id)
  console.log('Subscription:', (invoice as any).subscription)

  if (!(invoice as any).subscription) return

  // Buscar usuário pelo customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .maybeSingle()

  if (profileError || !profile) {
    console.error('Usuário não encontrado para customer:', invoice.customer)
    return
  }

  // Atualizar status para active
  const { data: result, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)
    .select()

  if (updateError) {
    console.error('ERRO ao ativar assinatura:', updateError)
    throw updateError
  }

  console.log('SUCESSO! Assinatura ativada:', result)
}

async function handlePaymentFailure(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  console.log('=== PROCESSANDO FALHA DE PAGAMENTO ===')
  console.log('Invoice ID:', invoice.id)
  console.log('Subscription:', (invoice as any).subscription)

  if (!(invoice as any).subscription) return

  // Buscar usuário pelo customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .maybeSingle()

  if (profileError || !profile) {
    console.error('Usuário não encontrado para customer:', invoice.customer)
    return
  }

  // Atualizar status para past_due
  const { data: result, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)
    .select()

  if (updateError) {
    console.error('ERRO ao marcar assinatura como past_due:', updateError)
    throw updateError
  }

  console.log('SUCESSO! Assinatura marcada como past_due:', result)
}
