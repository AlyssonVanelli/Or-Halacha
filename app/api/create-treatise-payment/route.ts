import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Função para obter a URL base correta
function getBaseUrl() {
  // Se NEXT_PUBLIC_APP_URL estiver definida, usar ela (prioridade)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log('Usando NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Em produção (Vercel), usar a URL do domínio
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`
    console.log('Usando VERCEL_URL:', url)
    return url
  }

  // Fallback para localhost em desenvolvimento
  console.log('Usando fallback localhost')
  return 'http://localhost:3000'
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    console.log('=== INICIANDO COMPRA DE TRATADO AVULSO ===')
    const { userId, divisionId, bookId, userEmail } = await req.json()
    
    console.log('Parâmetros recebidos:', { userId, divisionId, bookId, userEmail })

    if (!userId || !divisionId || !bookId) {
      console.error('Parâmetros obrigatórios faltando:', { userId, divisionId, bookId })
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios: userId, divisionId, bookId',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    console.log('Cliente Supabase criado')

    // Buscar ou criar customer no Stripe
    console.log('Buscando profile do usuário:', userId)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Erro ao buscar profile:', profileError)
    } else {
      console.log('Profile encontrado:', profile)
    }

    let stripeCustomerId = profile?.stripe_customer_id
    console.log('Stripe Customer ID atual:', stripeCustomerId)

    if (!stripeCustomerId) {
      console.log('Criando novo customer no Stripe para usuário:', userId)
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      })
      stripeCustomerId = customer.id
      console.log('Customer criado no Stripe:', stripeCustomerId)

      console.log('Atualizando profile com stripe_customer_id')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId)
      
      if (updateError) {
        console.error('Erro ao atualizar profile:', updateError)
      } else {
        console.log('Profile atualizado com sucesso')
      }
    }

    // Criar sessão de pagamento único (não assinatura)
    const baseUrl = getBaseUrl()
    const successUrl = `${baseUrl}/payment/success?treatise=true&divisionId=${divisionId}&bookId=${bookId}`
    const cancelUrl = `${baseUrl}/dashboard/biblioteca/shulchan-aruch`
    
    console.log('=== CRIANDO SESSÃO DE PAGAMENTO ===')
    console.log('Base URL:', baseUrl)
    console.log('Success URL:', successUrl)
    console.log('Cancel URL:', cancelUrl)
    
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'payment', // Modo de pagamento único
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Tratado Avulso - Shulchan Aruch',
              description: `Acesso por 1 mês ao tratado selecionado`,
            },
            unit_amount: 2990, // R$ 29,90 em centavos
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        divisionId,
        bookId,
        type: 'treatise-purchase',
      },
    }
    
    console.log('Configuração da sessão:', JSON.stringify(sessionConfig, null, 2))
    
    const session = await stripe.checkout.sessions.create(sessionConfig)
    console.log('Sessão criada com sucesso:', session.id)
    console.log('URL da sessão:', session.url)

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
