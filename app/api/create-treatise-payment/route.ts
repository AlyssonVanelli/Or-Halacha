import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, getBaseUrl, unauthorizedResponse } from '@/lib/api-auth'
import { ensureStripeCustomerId } from '@/lib/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { divisionId, bookId } = await req.json()
    if (!divisionId || !bookId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: divisionId, bookId' },
        { status: 400 }
      )
    }

    // Garante que a divisão existe antes de cobrar
    const { data: division } = await supabase
      .from('divisions')
      .select('id')
      .eq('id', divisionId)
      .maybeSingle()
    if (!division) {
      return NextResponse.json({ error: 'Tratado não encontrado' }, { status: 404 })
    }

    const stripeCustomerId = await ensureStripeCustomerId(user)

    const baseUrl = getBaseUrl()
    const params = new URLSearchParams({
      treatise: 'true',
      divisionId: String(divisionId),
      bookId: String(bookId),
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Tratado Avulso - Shulchan Aruch',
              description: 'Acesso por 1 mês ao tratado selecionado',
            },
            unit_amount: 2990, // R$ 29,90 em centavos
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment/success?${params.toString()}`,
      cancel_url: `${baseUrl}/dashboard/biblioteca/shulchan-aruch`,
      metadata: {
        userId: user.id,
        divisionId: String(divisionId),
        bookId: String(bookId),
        type: 'treatise-purchase',
      },
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Erro ao criar pagamento de tratado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
