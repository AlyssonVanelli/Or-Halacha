import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  console.log('=== TESTANDO CORREÇÃO DE ASSINATURA ===')

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
    // 1. Buscar assinatura atual no banco
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('ERRO ao buscar assinatura:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinatura',
          details: dbError,
        },
        { status: 500 }
      )
    }

    if (!dbSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assinatura não encontrada no banco',
        },
        { status: 404 }
      )
    }

    console.log('=== ASSINATURA ATUAL NO BANCO ===')
    console.log('ID:', dbSubscription.id)
    console.log('Status:', dbSubscription.status)
    console.log('Price ID:', dbSubscription.price_id)
    console.log('Explicação Prática:', dbSubscription.explicacao_pratica)
    console.log('Plan Type:', dbSubscription.plan_type)
    console.log('Subscription ID:', dbSubscription.subscription_id)

    // 2. Buscar no Stripe
    let stripeSubscription: any = null

    if (dbSubscription.subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.subscription_id)
        console.log('Assinatura encontrada no Stripe via ID')
      } catch (stripeError) {
        console.log('Erro ao buscar por ID, tentando por customer...')
      }
    }

    // 3. Se não encontrou por ID, buscar por customer
    if (!stripeSubscription) {
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileError || !profile || !profile.stripe_customer_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Perfil não encontrado ou sem Stripe Customer ID',
          },
          { status: 404 }
        )
      }

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

    console.log('=== ASSINATURA NO STRIPE ===')
    console.log('ID:', stripeSubscription.id)
    console.log('Status:', stripeSubscription.status)
    console.log('Price ID:', stripeSubscription.items.data[0]?.price?.id)
    console.log('Current Period Start:', stripeSubscription.current_period_start)
    console.log('Current Period End:', stripeSubscription.current_period_end)

    // 4. Determinar se é Plus
    const priceId = stripeSubscription.items.data[0]?.price?.id || ''
    const isPlusSubscription =
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'

    console.log('=== DETECÇÃO DE ASSINATURA PLUS ===')
    console.log('Price ID:', priceId)
    console.log('É Plus?', isPlusSubscription)

    // 5. Determinar plan_type
    let planType = 'yearly'
    if (priceId.includes('monthly') || priceId.includes('mensal')) {
      planType = 'monthly'
    }

    // 6. Preparar dados para atualização
    const updateData = {
      status: stripeSubscription.status,
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

    console.log('=== DADOS PARA ATUALIZAÇÃO ===')
    console.log('Explicação Prática:', isPlusSubscription)
    console.log('Dados completos:', updateData)

    // 7. Atualizar no banco
    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
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

    console.log('SUCESSO! Assinatura corrigida:', updateResult[0])

    return NextResponse.json({
      success: true,
      message: 'Assinatura testada e corrigida com sucesso',
      subscription: updateResult[0],
      changes: {
        old_explicacao_pratica: dbSubscription.explicacao_pratica,
        new_explicacao_pratica: isPlusSubscription,
        old_price_id: dbSubscription.price_id,
        new_price_id: priceId,
        old_status: dbSubscription.status,
        new_status: stripeSubscription.status,
        old_plan_type: dbSubscription.plan_type,
        new_plan_type: planType,
      },
    })
  } catch (error) {
    console.error('ERRO geral no teste:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral no teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
