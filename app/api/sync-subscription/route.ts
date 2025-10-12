import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  console.log('=== SINCRONIZANDO ASSINATURA ESPECÍFICA ===')

  const body = await req.json()
  const { userId, subscriptionId } = body

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
    // Buscar assinatura no banco
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

    if (!dbSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assinatura não encontrada no banco',
        },
        { status: 404 }
      )
    }

    console.log('Assinatura no banco:', dbSubscription)

    // Buscar no Stripe
    const stripeSubscriptionId = subscriptionId || dbSubscription.subscription_id

    if (!stripeSubscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID da assinatura no Stripe não encontrado',
        },
        { status: 400 }
      )
    }

    console.log('Buscando no Stripe:', stripeSubscriptionId)
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

    console.log('Assinatura no Stripe:', {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      current_period_start: (stripeSubscription as any).current_period_start,
      current_period_end: (stripeSubscription as any).current_period_end,
      canceled_at: stripeSubscription.canceled_at,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    })

    // Determinar se é Plus
    const priceId = stripeSubscription.items.data[0]?.price?.id || ''
    const isPlusSubscription = priceId.includes('plus') || priceId.includes('Plus')

    console.log('É assinatura Plus?', isPlusSubscription)
    console.log('Price ID:', priceId)

    // Atualizar no banco com dados do Stripe
    const updateData = {
      status: stripeSubscription.status as
        | 'active'
        | 'trialing'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid',
      current_period_start: (stripeSubscription as any).current_period_start
        ? new Date((stripeSubscription as any).current_period_start * 1000).toISOString()
        : null,
      current_period_end: (stripeSubscription as any).current_period_end
        ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      explicacao_pratica: isPlusSubscription,
      updated_at: new Date().toISOString(),
    }

    console.log('Dados para atualização:', updateData)

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

    console.log('Assinatura atualizada com sucesso:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada com sucesso',
      subscription: updateResult[0],
      stripeData: {
        status: stripeSubscription.status,
        current_period_start: (stripeSubscription as any).current_period_start,
        current_period_end: (stripeSubscription as any).current_period_end,
        canceled_at: stripeSubscription.canceled_at,
        isPlus: isPlusSubscription,
      },
    })
  } catch (error) {
    console.error('ERRO na sincronização:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno na sincronização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
