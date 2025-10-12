import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

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
  console.log('=== INICIANDO CRIAÇÃO DE CHECKOUT DE ASSINATURA ===')
  const body = await req.json()
  console.log('Dados recebidos:', body)

  const { planType, userId, userEmail, successUrl, cancelUrl, treatiseId } = body

  console.log('Plan Type:', planType)
  console.log('User ID:', userId)
  console.log('User Email:', userEmail)
  console.log('Success URL:', successUrl)
  console.log('Cancel URL:', cancelUrl)
  console.log('Treatise ID:', treatiseId)

  if (!planType || !PLAN_PRICE_IDS[planType]) {
    console.log('ERRO: Tipo de plano inválido')
    return NextResponse.json({ error: 'Tipo de plano inválido.' }, { status: 400 })
  }

  const priceId = PLAN_PRICE_IDS[planType]
  console.log('Price ID encontrado:', priceId)

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
    console.log('=== CRIANDO CLIENTE SUPABASE ===')
    // Buscar o perfil do usuário
    const supabase = createClient()
    console.log('Buscando perfil do usuário:', userId)

    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    console.log('Perfil encontrado:', !!profile, 'Erro:', profileError)

    // Se não encontrou o perfil, criar um novo
    if (!profile) {
      console.log('Perfil não encontrado, criando novo perfil...')
      try {
        const profileData = {
          id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log('Dados do novo perfil:', profileData)
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single()

        console.log('Novo perfil criado:', !!newProfile, 'Erro:', newProfileError)

        profile = newProfile
      } catch (createError) {
        // Continuar mesmo se não conseguir criar o perfil
        profile = null
      }
    }

    let stripeCustomerId = profile?.stripe_customer_id

    // Se não existir, criar o customer no Stripe e salvar no perfil
    if (!stripeCustomerId) {
      try {
        console.log('=== CRIANDO CUSTOMER NO STRIPE ===')
        // Usar email passado do frontend
        const userEmailToUse = userEmail || 'usuario@exemplo.com'
        console.log('Email do usuário:', userEmailToUse)

        console.log('Criando customer no Stripe...')
        const _customer = await stripe.customers.create({
          email: userEmailToUse,
          metadata: { userId },
        })

        stripeCustomerId = _customer.id
        console.log('Stripe Customer ID criado:', stripeCustomerId)

        try {
          if (profile) {
            console.log('Atualizando perfil com Stripe Customer ID...')
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                stripe_customer_id: stripeCustomerId,
              })
              .eq('id', userId)

            if (updateError) {
              console.log('ERRO ao atualizar perfil:', updateError)
            } else {
              console.log('Perfil atualizado com sucesso')
            }
          }
        } catch (err) {
          console.log('ERRO ao atualizar perfil:', err)
        }
      } catch (stripeError) {
        console.log('ERRO ao criar customer no Stripe:', stripeError)
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

        await stripe.customers.update(stripeCustomerId, {
          email: userEmailToUse,
        })
      } catch (updateError) {
        // Erro silencioso
      }
    }

    // Buscar o price no Stripe para saber se é one-time ou recurring
    console.log('=== BUSCANDO PRICE NO STRIPE ===')
    console.log('Price ID:', priceId)
    const price = await stripe.prices.retrieve(priceId)
    console.log('Price encontrado:', price.id, 'Tipo:', price.type)

    console.log('=== CRIANDO SESSÃO DE CHECKOUT ===')
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        planType,
        // Adicionar flag para identificar assinaturas Plus
        isPlus: planType.includes('plus') ? 'true' : 'false',
        ...(treatiseId && {
          divisionId: treatiseId,
          bookId: 'shulchan-aruch', // ID fixo do Shulchan Aruch
          treatiseId,
        }),
      },
    }

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

    console.log('Configuração da sessão:', sessionConfig)
    const session = await stripe.checkout.sessions.create(sessionConfig)
    console.log('Sessão criada com sucesso:', session.id)
    console.log('URL da sessão:', session.url)

    // Para tratados avulsos, salvar temporariamente qual tratado foi selecionado
    if (planType === 'tratado-avulso' && treatiseId) {
      console.log('Tratado avulso selecionado:', treatiseId)
      // Salvar no localStorage do frontend (será usado na página de sucesso)
      // Isso é uma solução temporária até configurar o webhook
    }

    const response = {
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
    }

    console.log('=== CHECKOUT CRIADO COM SUCESSO ===')
    console.log('Resposta:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.log('=== ERRO NA CRIAÇÃO DO CHECKOUT ===')
    console.error('Erro:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor. Tente novamente.',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
