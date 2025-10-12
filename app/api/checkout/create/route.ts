import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import {
  stripe,
  getOrCreateCustomer,
  createSubscriptionCheckoutSession,
  createSinglePurchaseCheckoutSession,
  PLAN_TYPES,
  PLAN_PRICE_IDS,
  validatePriceIds,
} from '@/lib/stripe'

// Schema de validação para o request
const CreateCheckoutSchema = z.object({
  planType: z.enum([
    PLAN_TYPES.MONTHLY_BASIC,
    PLAN_TYPES.MONTHLY_PLUS,
    PLAN_TYPES.YEARLY_BASIC,
    PLAN_TYPES.YEARLY_PLUS,
    PLAN_TYPES.SINGLE_BOOK,
  ]),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  divisionId: z.string().optional(), // Para compras avulsas
  metadata: z.record(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Validar request
    const body = await request.json()
    const validatedData = CreateCheckoutSchema.parse(body)

    const {
      planType,
      userId,
      userEmail,
      successUrl,
      cancelUrl,
      divisionId,
      metadata = {},
    } = validatedData

    console.log('=== CRIANDO CHECKOUT ===')
    console.log('Plan Type:', planType)
    console.log('User ID:', userId)
    console.log('User Email:', userEmail)
    console.log('Division ID:', divisionId)

    // Validar price IDs
    try {
      validatePriceIds()
    } catch (error) {
      console.error('Erro na validação dos price IDs:', error)
      return NextResponse.json(
        { error: 'Configuração de preços não encontrada. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    // Obter price ID
    const priceId = PLAN_PRICE_IDS[planType]
    if (!priceId) {
      return NextResponse.json({ error: 'Tipo de plano não suportado.' }, { status: 400 })
    }

    // Verificar se price ID é válido no Stripe
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe não está configurado. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    try {
      await stripe.prices.retrieve(priceId)
    } catch (error) {
      console.error('Price ID inválido:', error)
      return NextResponse.json(
        { error: 'Configuração de preço inválida. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    // Buscar ou criar perfil do usuário
    const supabase = createClient()
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao buscar dados do usuário.' }, { status: 500 })
    }

    // Criar ou buscar customer no Stripe
    let customerId: string

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
      console.log('Customer existente:', customerId)
    } else {
      console.log('Criando novo customer...')
      const customer = await getOrCreateCustomer(userId, userEmail)
      customerId = customer.id

      // Salvar customer ID no perfil
      const { error: updateError } = await supabase.from('profiles').upsert({
        id: userId,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })

      if (updateError) {
        console.error('Erro ao salvar customer ID:', updateError)
        // Continuar mesmo com erro
      }
    }

    // Preparar metadata adicional
    const sessionMetadata = {
      ...metadata,
      planType,
      userId,
      userEmail,
      ...(divisionId && { divisionId }),
    }

    // Criar sessão de checkout
    let session

    if (planType === PLAN_TYPES.SINGLE_BOOK) {
      // Compra avulsa
      if (!divisionId) {
        return NextResponse.json(
          { error: 'ID da divisão é obrigatório para compras avulsas.' },
          { status: 400 }
        )
      }

      session = await createSinglePurchaseCheckoutSession({
        priceId,
        customerId,
        userId,
        userEmail,
        successUrl,
        cancelUrl,
        metadata: sessionMetadata,
      })
    } else {
      // Assinatura
      session = await createSubscriptionCheckoutSession({
        priceId,
        customerId,
        userId,
        userEmail,
        successUrl,
        cancelUrl,
        metadata: sessionMetadata,
      })
    }

    console.log('Sessão criada com sucesso:', session.id)

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
      {
        error: 'Erro interno do servidor. Tente novamente.',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
