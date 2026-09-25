import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, safeReturnUrl, unauthorizedResponse } from '@/lib/api-auth'
import { ensureStripeCustomerId, planIntervalError } from '@/lib/stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

// Mapeamento dos planos para price IDs do Stripe
const PLAN_PRICE_IDS: Record<string, string> = {
  'tratado-avulso': process.env.NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK || '',
  'mensal-basico': process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL || '',
  'anual-basico': process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL || '',
  'mensal-plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS || '',
  'anual-plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS || '',
}

export async function POST(req: Request) {
  const { user } = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const body = await req.json()
  const { planType, successUrl, cancelUrl, treatiseId } = body

  if (!planType || !(planType in PLAN_PRICE_IDS)) {
    return NextResponse.json({ error: 'Tipo de plano inválido.' }, { status: 400 })
  }

  const priceId = PLAN_PRICE_IDS[planType]
  if (!priceId) {
    return NextResponse.json(
      { error: 'Configuração de preço não encontrada. Entre em contato com o suporte.' },
      { status: 500 }
    )
  }

  if (planType === 'tratado-avulso' && !treatiseId) {
    return NextResponse.json({ error: 'Tratado não informado.' }, { status: 400 })
  }

  try {
    const stripeCustomerId = await ensureStripeCustomerId(user)

    const price = await stripe.prices.retrieve(priceId)
    const isRecurring = price.type === 'recurring'

    // Proteção: plano anual precisa de preço anual no Stripe (e mensal, de preço mensal).
    // Um preço mal configurado cobraria o valor anual todo mês.
    const intervalError = planIntervalError(planType, price)
    if (intervalError) {
      console.error(intervalError)
      return NextResponse.json(
        { error: 'Plano temporariamente indisponível. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }
    const isPlus = planType.includes('plus') ? 'true' : 'false'

    const metadata: Record<string, string> = {
      userId: user.id,
      planType,
      isPlus,
      ...(!isRecurring &&
        treatiseId && {
          divisionId: String(treatiseId),
          bookId: 'shulchan-aruch', // ID fixo do Shulchan Aruch
          treatiseId: String(treatiseId),
        }),
    }

    const session = await stripe.checkout.sessions.create({
      mode: isRecurring ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: safeReturnUrl(successUrl, req, '/payment/success'),
      cancel_url: safeReturnUrl(cancelUrl, req, '/payment/cancel'),
      allow_promotion_codes: true,
      metadata,
      ...(isRecurring && {
        subscription_data: { metadata: { userId: user.id, planType, isPlus } },
      }),
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      treatiseId,
      ...(planType === 'tratado-avulso' &&
        treatiseId && {
          treatiseData: {
            divisionId: treatiseId,
            bookId: 'shulchan-aruch',
          },
        }),
    })
  } catch (error) {
    console.error('Erro na criação do checkout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    )
  }
}
