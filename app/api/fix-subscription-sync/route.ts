import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  console.log('=== CORRIGINDO SINCRONIZAÇÃO DE ASSINATURAS ===')

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

    // 2. Buscar assinaturas ativas no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    console.log('Assinaturas no Stripe:', stripeSubscriptions.data.length)

    if (stripeSubscriptions.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma assinatura encontrada no Stripe',
        },
        { status: 404 }
      )
    }

    // 3. Pegar a assinatura mais recente e ativa
    const activeSubscription = stripeSubscriptions.data
      .filter(sub => sub.status === 'active')
      .sort((a, b) => b.created - a.created)[0]

    if (!activeSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma assinatura ativa encontrada no Stripe',
        },
        { status: 404 }
      )
    }

    console.log('Assinatura ativa no Stripe:', {
      id: activeSubscription.id,
      status: activeSubscription.status,
      price_id: activeSubscription.items.data[0]?.price?.id,
      current_period_start: (activeSubscription as any).current_period_start,
      current_period_end: (activeSubscription as any).current_period_end,
    })

    // 4. Determinar se é Plus baseado no price_id
    const priceId = activeSubscription.items.data[0]?.price?.id || ''
    const isPlusSubscription =
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40' // Seu price_id específico

    console.log('=== DETECÇÃO DE ASSINATURA PLUS ===')
    console.log('Price ID:', priceId)
    console.log('É Plus?', isPlusSubscription)

    // 5. Determinar plan_type
    let planType: 'monthly' | 'yearly' = 'yearly'
    if (priceId.includes('monthly') || priceId.includes('mensal')) {
      planType = 'monthly'
    }

    // 6. Preparar dados para atualização
    const subscriptionData = {
      user_id: profile.id,
      status: activeSubscription.status as 'active',
      plan_type: planType,
      price_id: priceId,
      subscription_id: activeSubscription.id,
      current_period_start: (activeSubscription as any).current_period_start
        ? new Date((activeSubscription as any).current_period_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: (activeSubscription as any).current_period_end
        ? new Date((activeSubscription as any).current_period_end * 1000).toISOString()
        : new Date(
            Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
      cancel_at_period_end: activeSubscription.cancel_at_period_end,
      explicacao_pratica: isPlusSubscription, // CORRIGIDO: Agora salva corretamente
      updated_at: new Date().toISOString(),
    }

    console.log('=== DADOS PARA ATUALIZAÇÃO ===')
    console.log('Explicação Prática:', isPlusSubscription)
    console.log('Dados completos:', subscriptionData)

    // 7. Atualizar no banco
    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (updateError) {
      console.error('ERRO ao atualizar assinatura:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao atualizar assinatura',
          details: updateError,
        },
        { status: 500 }
      )
    }

    console.log('SUCESSO! Assinatura corrigida:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada e corrigida com sucesso',
      subscription: updateResult[0],
      changes: {
        explicacao_pratica: isPlusSubscription,
        price_id: priceId,
        plan_type: planType,
      },
    })
  } catch (error) {
    console.error('ERRO geral na correção:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral na correção',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
