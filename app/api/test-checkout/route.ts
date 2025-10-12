import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/client'

// Função para obter a URL base correta
function getBaseUrl() {
  // Em produção (Vercel), usar a URL do domínio
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Se NEXT_PUBLIC_APP_URL estiver definida, usar ela
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Fallback para localhost em desenvolvimento
  return 'http://localhost:3000'
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTE DE CHECKOUT ===')

    const { userId, priceId, mode = 'subscription' } = await request.json()

    if (!userId || !priceId) {
      return NextResponse.json({ error: 'userId e priceId são obrigatórios' }, { status: 400 })
    }

    console.log('User ID:', userId)
    console.log('Price ID:', priceId)
    console.log('Mode:', mode)

    const supabase = createClient()

    // 1. Verificar se usuário existe
    console.log('\n--- VERIFICANDO USUÁRIO ---')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Erro ao buscar usuário:', profileError)
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado',
          details: profileError,
        },
        { status: 404 }
      )
    }

    console.log('✅ Usuário encontrado:', profile.id)
    console.log('Stripe Customer ID:', profile.stripe_customer_id)

    // 2. Verificar/criar customer no Stripe
    console.log('\n--- VERIFICANDO/CRIANDO CUSTOMER ---')
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      console.log('Criando customer no Stripe...')
      try {
        const customer = await stripe.customers.create({
          email: profile.email || `user-${userId}@test.com`,
          metadata: {
            user_id: userId,
          },
        })
        customerId = customer.id
        console.log('✅ Customer criado:', customerId)

        // Atualizar perfil com customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId)

        if (updateError) {
          console.error('❌ Erro ao atualizar perfil:', updateError)
        } else {
          console.log('✅ Perfil atualizado com customer ID')
        }
      } catch (error) {
        console.error('❌ Erro ao criar customer:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao criar customer no Stripe',
            details: error instanceof Error ? error.message : 'Erro desconhecido',
          },
          { status: 500 }
        )
      }
    } else {
      console.log('✅ Customer já existe:', customerId)
    }

    // 3. Verificar price no Stripe
    console.log('\n--- VERIFICANDO PRICE ---')
    try {
      const price = await stripe.prices.retrieve(priceId)
      console.log('✅ Price encontrado:', price.id)
      console.log('Price amount:', price.unit_amount)
      console.log('Price currency:', price.currency)
      console.log('Price type:', price.type)
    } catch (error) {
      console.error('❌ Erro ao buscar price:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Price não encontrado no Stripe',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 404 }
      )
    }

    // 4. Criar checkout session
    console.log('\n--- CRIANDO CHECKOUT SESSION ---')
    try {
      const sessionParams: any = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: mode,
        success_url: `${getBaseUrl()}/test-stripe?success=true`,
        cancel_url: `${getBaseUrl()}/test-stripe?canceled=true`,
        metadata: {
          userId: userId,
          test: 'true',
        },
      }

      if (mode === 'subscription') {
        sessionParams.line_items = [
          {
            price: priceId,
            quantity: 1,
          },
        ]
      } else {
        sessionParams.line_items = [
          {
            price: priceId,
            quantity: 1,
          },
        ]
      }

      console.log('Parâmetros da sessão:', JSON.stringify(sessionParams, null, 2))

      const session = await stripe.checkout.sessions.create(sessionParams)

      console.log('✅ Checkout session criada:', session.id)
      console.log('Session URL:', session.url)

      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
          customerId: customerId,
          priceId: priceId,
          mode: mode,
        },
      })
    } catch (error) {
      console.error('❌ Erro ao criar checkout session:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar checkout session',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro geral no teste de checkout:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
