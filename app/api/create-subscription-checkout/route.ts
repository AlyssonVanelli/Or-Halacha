import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import type { Profile } from '@/lib/db'
// import { createClient } from '@/lib/supabase/client'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

interface ProfileWithStripeId extends Profile {
  stripe_customer_id: string
}

// Mapeamento dos planos para price IDs do Stripe
const PLAN_PRICE_IDS: Record<string, string> = {
  'tratado-avulso': process.env.NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK || '',
  'mensal-basico': process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL || '',
  'anual-basico': process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL || '',
  'mensal-plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS || '',
  'anual-plus': process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS || '',
}

export async function POST(req: Request) {
  const body = await req.json()
  const { planType, userId, userEmail, successUrl, cancelUrl, treatiseId } = body

  if (!planType || !PLAN_PRICE_IDS[planType]) {
    return NextResponse.json({ error: 'Tipo de plano inválido.' }, { status: 400 })
  }

  const priceId = PLAN_PRICE_IDS[planType]

  if (!priceId) {
    return NextResponse.json(
      { error: 'Configuração de preço não encontrada. Entre em contato com o suporte.' },
      { status: 500 }
    )
  }

  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Configuração de pagamento não encontrada. Entre em contato com o suporte.' },
      { status: 500 }
    )
  }

  try {
    // Buscar o perfil do usuário
    let profile = await db.profiles.getById(userId)

    // Se não encontrou o perfil, criar um novo
    if (!profile) {
      try {
        const profileData = {
          id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        profile = await db.profiles.create(profileData)
      } catch (createError) {
        // Continuar mesmo se não conseguir criar o perfil
        profile = null
      }
    }

    let stripeCustomerId = profile?.stripe_customer_id

    // Se não existir, criar o customer no Stripe e salvar no perfil
    if (!stripeCustomerId) {
      try {
        // Usar email passado do frontend
        const userEmailToUse = userEmail || 'usuario@exemplo.com'

        const _customer = await stripe.customers.create({
          email: userEmailToUse,
          metadata: { userId },
        })

        stripeCustomerId = _customer.id

        try {
          if (profile) {
            await db.profiles.update(userId, {
              stripe_customer_id: stripeCustomerId,
              email: userEmail,
            } as ProfileWithStripeId)
          }
        } catch (err) {
          // Erro silencioso
        }
      } catch (stripeError) {
        return NextResponse.json(
          {
            error: 'Erro ao configurar pagamento. Tente novamente.',
          },
          { status: 500 }
        )
      }
    } else {
      // Atualizar email do customer existente se necessário
      try {
        const userEmailToUse = userEmail || 'usuario@exemplo.com'

        const _customer = await stripe.customers.update(stripeCustomerId, {
          email: userEmailToUse,
        })
      } catch (updateError) {
        // Erro silencioso
      }
    }

    // Buscar o price no Stripe para saber se é one-time ou recurring
    const price = await stripe.prices.retrieve(priceId)

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        planType,
        ...(treatiseId && {
          divisionId: treatiseId,
          bookId: 'shulchan-aruch', // ID fixo do Shulchan Aruch
          treatiseId,
        }),
      },
    }

    console.log('⚙️ Configuração da sessão:', {
      customer: stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: sessionConfig.metadata,
    })

    if (price.type === 'recurring') {
      sessionConfig.mode = 'subscription'
    } else {
      sessionConfig.mode = 'payment'
    }

    sessionConfig.line_items = [
      {
        price: priceId,
        quantity: 1,
      },
    ]

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Para tratados avulsos, salvar temporariamente qual tratado foi selecionado
    if (planType === 'tratado-avulso' && treatiseId) {
      // Salvar no localStorage do frontend (será usado na página de sucesso)
      // Isso é uma solução temporária até configurar o webhook
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      treatiseId: treatiseId,
      // Para tratado avulso, incluir dados para salvar no localStorage
      ...(planType === 'tratado-avulso' &&
        treatiseId && {
          treatiseData: {
            divisionId: treatiseId,
            bookId: 'shulchan-aruch',
          },
        }),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno do servidor. Tente novamente.',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
