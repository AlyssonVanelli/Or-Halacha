import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log('🔔 WEBHOOK CHAMADO:', new Date().toISOString())

  const supabase = createClient()
  const body = await req.text()
  const signature = headers().get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('📥 EVENTO RECEBIDO:', event.type)
    console.log('📊 DADOS COMPLETOS DO EVENTO:', JSON.stringify(event.data.object, null, 2))
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('❌ Erro na verificação da assinatura do webhook:', errorMessage)
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      console.log('💳 PROCESSANDO PAYMENT_INTENT.SUCCEEDED')
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const customerId = paymentIntent.customer as string

      console.log('👤 Customer ID:', customerId)
      console.log('📋 Metadata do PaymentIntent:', paymentIntent.metadata)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      console.log('🔍 Busca do profile:', { profile, profileError })

      if (profileError || !profile) {
        console.log('❌ Profile não encontrado ou erro na busca')
        break
      }

      const purchaseType = paymentIntent.metadata?.type
      const divisionId = paymentIntent.metadata?.divisionId
      const bookId = paymentIntent.metadata?.bookId

      console.log('📊 Dados extraídos:', { purchaseType, divisionId, bookId })

      // Verificar se é compra única de tratado
      if (purchaseType === 'treatise-purchase' && divisionId && bookId) {
        console.log(
          '📚 PROCESSANDO COMPRA ÚNICA DE TRATADO - Iniciando inserção na purchased_books'
        )

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        const purchaseData = {
          user_id: profile.id,
          book_id: bookId,
          division_id: divisionId,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        }

        console.log('💾 Dados para inserção na purchased_books:', purchaseData)

        const { data: insertData, error: purchaseError } = await supabase
          .from('purchased_books')
          .upsert(purchaseData, { onConflict: 'user_id,division_id' })
          .select()

        console.log('💾 RESULTADO DA INSERÇÃO - purchased_books:', {
          success: !purchaseError,
          data: insertData,
          error: purchaseError,
          purchaseData,
        })

        if (purchaseError) {
          console.error('❌ ERRO AO INSERIR NA purchased_books:', purchaseError)
        } else {
          console.log('✅ SUCESSO: Tratado avulso inserido na purchased_books!')
        }

        return NextResponse.json({ received: true })
      } else {
        console.log('⚠️ Não é compra única de tratado ou dados insuficientes:', {
          purchaseType,
          divisionId,
          bookId,
        })
      }

      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      console.log('🔄 PROCESSANDO SUBSCRIPTION EVENT:', event.type)
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('🔄 Dados da subscription:', {
        type: event.type,
        customerId,
        status: subscription.status,
        metadata: subscription.metadata,
        subscriptionId: subscription.id,
      })

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      console.log('🔍 Profile encontrado para subscription:', { profile, profileError })

      if (profileError || !profile) {
        console.log('❌ Profile não encontrado para subscription')
        break
      }

      const purchaseType = subscription.metadata?.type
      const planType = subscription.metadata?.planType

      console.log('📊 Dados extraídos da subscription:', { purchaseType, planType })

      // IGNORAR compras únicas que aparecem como subscription
      if (purchaseType === 'treatise-purchase') {
        console.log(
          '📚 ⚠️ COMPRA ÚNICA DETECTADA EM SUBSCRIPTION - IGNORANDO (já processada via payment_intent)'
        )
        return NextResponse.json({ received: true })
      }

      // IGNORAR tratados avulsos antigos
      if (planType === 'tratado-avulso') {
        console.log('📚 ⚠️ TRATADO AVULSO ANTIGO DETECTADO EM SUBSCRIPTION - IGNORANDO')
        return NextResponse.json({ received: true })
      }

      console.log('💾 PROCESSANDO SUBSCRIPTION NORMAL - Inserindo na tabela subscriptions')

      const subscriptionData = {
        user_id: profile.id,
        status: subscription.status,
        plan_type: planType as 'monthly' | 'yearly',
        price_id: subscription.items.data[0]?.price?.id || '',
        subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        explicacao_pratica: false,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      console.log(
        '💾 Dados da subscription para inserção na tabela subscriptions:',
        subscriptionData
      )

      const { data: insertData, error: insertError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' })
        .select()

      console.log('💾 RESULTADO DA INSERÇÃO - subscriptions:', {
        success: !insertError,
        data: insertData,
        error: insertError,
        subscriptionData,
      })

      if (insertError) {
        console.error('❌ ERRO AO INSERIR NA subscriptions:', insertError)
      } else {
        console.log('✅ SUCESSO: Subscription inserida na tabela subscriptions!')
      }

      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
