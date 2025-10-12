import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Função para obter a URL base correta
function getBaseUrl() {
  // Se NEXT_PUBLIC_APP_URL estiver definida, usar ela (prioridade)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Em produção (Vercel), usar a URL do domínio
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback para localhost em desenvolvimento
  return 'http://localhost:3000'
}

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
    const planMapping = {
      'mensal-basico':
        process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL || 'price_1RQCoOFLuMsSi0YiBmCrrM1r',
      'mensal-plus':
        process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS || 'price_1RQCoOFLuMsSi0YiBmCrrM1r',
      'anual-basico':
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL || 'price_1RQCoOFLuMsSi0YiBmCrrM1r',
      'anual-plus':
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS || 'price_1RQCoOFLuMsSi0YiBmCrrM1r',
    }

    const newPriceId = planMapping[planType as keyof typeof planMapping]

    console.log('=== DEBUG UPGRADE ===')
    console.log('planType recebido:', planType)
    console.log('newPriceId mapeado:', newPriceId)
    console.log('Variáveis de ambiente:')
    console.log('- NEXT_PUBLIC_STRIPE_PRICE_MENSAL:', process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL)
    console.log(
      '- NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS:',
      process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS
    )
    console.log('- NEXT_PUBLIC_STRIPE_PRICE_ANUAL:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL)
    console.log(
      '- NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS:',
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS
    )

    if (!newPriceId) {
      return NextResponse.json({ error: 'Tipo de plano inválido' }, { status: 400 })
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
