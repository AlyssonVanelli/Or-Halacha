import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    console.log('=== TESTE DE COMPRA DE TRATADO AVULSO ===')

    const { userId, divisionId, bookId, userEmail } = await req.json()

    console.log('Parâmetros:', { userId, divisionId, bookId, userEmail })

    const supabase = await createClient()

    // Buscar customer
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
    }

    // Criar sessão de teste
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Teste - Tratado Avulso',
              description: 'Teste de compra de tratado avulso',
            },
            unit_amount: 2990,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://or-halacha.vercel.app/payment/success?test=true',
      cancel_url: 'https://or-halacha.vercel.app/dashboard',
      metadata: {
        userId,
        divisionId,
        bookId,
        type: 'treatise-purchase',
        test: 'true',
      },
    })

    console.log('Sessão de teste criada:', session.id)
    console.log('URL da sessão:', session.url)
    console.log('Metadata enviado:', session.metadata)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      metadata: session.metadata,
      message: 'Sessão de teste criada para tratado avulso',
    })
  } catch (error) {
    console.error('Erro no teste:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
