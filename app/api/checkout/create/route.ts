import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser, safeReturnUrl, unauthorizedResponse } from '@/lib/api-auth'
import {
  stripe,
  ensureStripeCustomerId,
  planIntervalError,
  createSubscriptionCheckoutSession,
  createSinglePurchaseCheckoutSession,
  PLAN_TYPES,
  PLAN_PRICE_IDS,
} from '@/lib/stripe'

// userId/userEmail do corpo são ignorados; o usuário vem da sessão
const CreateCheckoutSchema = z.object({
  planType: z.enum([
    PLAN_TYPES.MONTHLY_BASIC,
    PLAN_TYPES.MONTHLY_PLUS,
    PLAN_TYPES.YEARLY_BASIC,
    PLAN_TYPES.YEARLY_PLUS,
    PLAN_TYPES.SINGLE_BOOK,
  ]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  divisionId: z.string().optional(), // Para compras avulsas
})

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { planType, successUrl, cancelUrl, divisionId } = CreateCheckoutSchema.parse(body)

    const priceId = PLAN_PRICE_IDS[planType]
    if (!priceId || !stripe) {
      return NextResponse.json(
        { error: 'Configuração de preços não encontrada. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    if (planType === PLAN_TYPES.SINGLE_BOOK && !divisionId) {
      return NextResponse.json(
        { error: 'ID da divisão é obrigatório para compras avulsas.' },
        { status: 400 }
      )
    }

    const intervalError = planIntervalError(planType, await stripe.prices.retrieve(priceId))
    if (intervalError) {
      console.error(intervalError)
      return NextResponse.json(
        { error: 'Plano temporariamente indisponível. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    const customerId = await ensureStripeCustomerId(user)
    const userEmail = user.email || ''

    const metadata: Record<string, string> = {
      planType,
      userId: user.id,
      isPlus: planType.includes('plus') ? 'true' : 'false',
      ...(divisionId && { divisionId, bookId: 'shulchan-aruch' }),
    }

    const params = {
      priceId,
      customerId,
      userId: user.id,
      userEmail,
      successUrl: safeReturnUrl(successUrl, request, '/dashboard'),
      cancelUrl: safeReturnUrl(cancelUrl, request, '/dashboard'),
      metadata,
    }

    const session =
      planType === PLAN_TYPES.SINGLE_BOOK
        ? await createSinglePurchaseCheckoutSession(params)
        : await createSubscriptionCheckoutSession(params)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      metadata: {
        planType,
        divisionId,
        isSubscription: planType !== PLAN_TYPES.SINGLE_BOOK,
      },
    })
  } catch (error) {
    console.error('Erro ao criar checkout:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos.',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    )
  }
}
