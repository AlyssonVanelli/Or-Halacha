import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  console.log('=== FORÇANDO SINCRONIZAÇÃO COMPLETA ===')

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
    // 1. Buscar perfil
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

    // 2. Buscar assinatura atual no banco
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('ERRO ao buscar assinatura no banco:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinatura no banco',
          details: dbError,
        },
        { status: 500 }
      )
    }

    console.log('Assinatura atual no banco:', dbSubscription)

    // 3. Buscar no Stripe usando subscription_id se disponível
    let stripeSubscription: any = null
    if (dbSubscription?.subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.subscription_id)
        console.log('Assinatura encontrada no Stripe via ID:', stripeSubscription.id)
      } catch (stripeError) {
        console.log('Erro ao buscar por ID, tentando por customer...')
      }
    }

    // 4. Se não encontrou por ID, buscar por customer
    if (!stripeSubscription) {
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'all',
        limit: 10,
      })

      if (stripeSubscriptions.data.length > 0) {
        // Pegar a mais recente e ativa
        stripeSubscription = stripeSubscriptions.data
          .filter(sub => sub.status === 'active')
          .sort((a, b) => b.created - a.created)[0]

        if (!stripeSubscription) {
          // Se não tem ativa, pegar a mais recente
          stripeSubscription = stripeSubscriptions.data.sort((a, b) => b.created - a.created)[0]
        }
      }
    }

    if (!stripeSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma assinatura encontrada no Stripe',
        },
        { status: 404 }
      )
    }

    console.log('Assinatura no Stripe:', {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      price_id: stripeSubscription.items.data[0]?.price?.id,
      current_period_start: stripeSubscription.current_period_start,
      current_period_end: stripeSubscription.current_period_end,
    })

    // 5. Determinar se é Plus
    const priceId = stripeSubscription.items.data[0]?.price?.id || ''
    const isPlusSubscription =
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'

    console.log('=== DETECÇÃO DE ASSINATURA PLUS ===')
    console.log('Price ID:', priceId)
    console.log('É Plus?', isPlusSubscription)

    // 6. Determinar plan_type
    let planType: 'monthly' | 'yearly' = 'yearly'
    if (priceId.includes('monthly') || priceId.includes('mensal')) {
      planType = 'monthly'
    }

    // 7. Preparar dados para atualização
    const subscriptionData = {
      user_id: profile.id,
      status: stripeSubscription.status as
        | 'active'
        | 'trialing'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid',
      plan_type: planType,
      price_id: priceId,
      subscription_id: stripeSubscription.id,
      current_period_start: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : new Date(
            Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      explicacao_pratica: isPlusSubscription, // CORRIGIDO
      updated_at: new Date().toISOString(),
    }

    console.log('=== DADOS FINAIS ===')
    console.log('Explicação Prática:', isPlusSubscription)
    console.log('Dados completos:', subscriptionData)

    // 8. Atualizar no banco
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

    console.log('SUCESSO! Assinatura sincronizada:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada com sucesso',
      subscription: updateResult[0],
      changes: {
        old_explicacao_pratica: dbSubscription?.explicacao_pratica,
        new_explicacao_pratica: isPlusSubscription,
        price_id: priceId,
        plan_type: planType,
        status: stripeSubscription.status,
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
