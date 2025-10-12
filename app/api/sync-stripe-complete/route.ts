import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  console.log('=== SINCRONIZAÇÃO COMPLETA STRIPE -> BANCO ===')

  const body = await req.json()
  const { userId } = body

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId é obrigatório',
      },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    // 1. Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Perfil não encontrado',
        },
        { status: 404 }
      )
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não tem Stripe Customer ID',
        },
        { status: 404 }
      )
    }

    console.log('Perfil encontrado:', profile)

    // 2. Buscar TODAS as assinaturas no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 100,
    })

    console.log(`Encontradas ${stripeSubscriptions.data.length} assinaturas no Stripe`)

    if (stripeSubscriptions.data.length === 0) {
      // Se não tem assinaturas no Stripe, cancelar no banco
      const { data: cancelResult, error: cancelError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()

      if (cancelError) {
        console.error('ERRO ao cancelar assinatura:', cancelError)
      } else {
        console.log('Assinatura cancelada no banco (sem assinaturas no Stripe)')
      }

      return NextResponse.json({
        success: true,
        message: 'Nenhuma assinatura no Stripe - cancelada no banco',
        subscription: cancelResult?.[0],
      })
    }

    // 3. Pegar a assinatura mais recente
    const latestSubscription = stripeSubscriptions.data.sort((a, b) => b.created - a.created)[0]

    console.log('Assinatura mais recente no Stripe:', {
      id: latestSubscription.id,
      status: latestSubscription.status,
      created: new Date(latestSubscription.created * 1000).toISOString(),
      price_id: latestSubscription.items.data[0]?.price?.id,
    })

    // 4. Determinar tipo de plano
    const priceId = latestSubscription.items.data[0]?.price?.id || ''
    const isPlus =
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'
    const planType =
      priceId.includes('monthly') || priceId.includes('mensal') ? 'monthly' : 'yearly'

    console.log('=== DETECÇÃO DE PLANO ===')
    console.log('Price ID:', priceId)
    console.log('É Plus:', isPlus)
    console.log('Plan Type:', planType)

    // 5. Preparar dados para sincronização
    const subscriptionData = {
      user_id: profile.id,
      status: latestSubscription.status as any,
      plan_type: planType,
      price_id: priceId,
      subscription_id: latestSubscription.id,
      current_period_start: (latestSubscription as any).current_period_start
        ? new Date((latestSubscription as any).current_period_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: (latestSubscription as any).current_period_end
        ? new Date((latestSubscription as any).current_period_end * 1000).toISOString()
        : new Date(
            Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
      cancel_at_period_end: latestSubscription.cancel_at_period_end || false,
      explicacao_pratica: isPlus,
      updated_at: new Date().toISOString(),
    }

    console.log('=== DADOS PARA SINCRONIZAÇÃO ===')
    console.log('Explicação Prática:', isPlus)
    console.log('Status:', latestSubscription.status)
    console.log('Dados completos:', subscriptionData)

    // 6. Sincronizar com banco
    const { data: syncResult, error: syncError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (syncError) {
      console.error('ERRO ao sincronizar:', syncError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao sincronizar assinatura',
          details: syncError,
        },
        { status: 500 }
      )
    }

    console.log('SUCESSO! Assinatura sincronizada:', syncResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada com sucesso',
      subscription: syncResult[0],
      changes: {
        explicacao_pratica: isPlus,
        status: latestSubscription.status,
        price_id: priceId,
        plan_type: planType,
      },
    })
  } catch (error) {
    console.error('ERRO geral na sincronização:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral na sincronização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
