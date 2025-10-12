import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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

export async function POST(req: Request) {
  try {
    const { userId, divisionId, bookId, userEmail } = await req.json()

    if (!userId || !divisionId || !bookId) {
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios: userId, divisionId, bookId',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar ou criar customer no Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      })
      stripeCustomerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId)
    }

    // Criar sessão de pagamento único (não assinatura)
    const session = await stripe.checkout.sessions.create({
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
      success_url: `${getBaseUrl()}/payment/success?treatise=true&divisionId=${divisionId}&bookId=${bookId}`,
      cancel_url: `${getBaseUrl()}/dashboard`,
      metadata: {
        userId,
        divisionId,
        bookId,
        type: 'treatise-purchase',
      },
    })

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
