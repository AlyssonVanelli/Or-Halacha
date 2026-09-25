import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { getBaseUrl } from '@/lib/api-auth'
import { planIntervalError } from '@/lib/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { planType } = await request.json()

    if (!planType) {
      return NextResponse.json({ error: 'Tipo de plano é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinatura atual
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Mapear planos para price_ids corretos do Stripe
    const planMapping: Record<string, string | undefined> = {
      'mensal-basico': process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL,
      'mensal-plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS,
      'anual-basico': process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL,
      'anual-plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS,
    }

    const newPriceId = planMapping[planType]
    if (!newPriceId) {
      return NextResponse.json({ error: 'Tipo de plano inválido' }, { status: 400 })
    }

    const intervalError = planIntervalError(planType, await stripe.prices.retrieve(newPriceId))
    if (intervalError) {
      console.error(intervalError)
      return NextResponse.json(
        { error: 'Plano temporariamente indisponível. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    // Buscar customer no Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Cliente não encontrado no Stripe' }, { status: 404 })
    }

    // Criar sessão de checkout para upgrade
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: newPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${getBaseUrl()}/dashboard?upgrade=success`,
      cancel_url: `${getBaseUrl()}/dashboard?upgrade=cancelled`,
      metadata: {
        userId: user.id,
        planType: planType,
        isUpgrade: 'true',
      },
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
    })
  } catch (error) {
    console.error('Erro ao fazer upgrade:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
