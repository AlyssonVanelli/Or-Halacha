import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // 1. Verificar no Supabase
    const supabase = createClient()

    // Assinatura no banco
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // Livros comprados no banco
    const { data: purchasedData, error: purchasedError } = await supabase
      .from('purchased_books')
      .select('division_id, expires_at')
      .eq('user_id', userId)

    // 2. Verificar no Stripe
    let stripeCustomer: Stripe.Customer | null = null
    let stripeSubscriptions: Stripe.Subscription[] = []

    try {
      // Buscar customer no Stripe
      const customers = await stripe.customers.list({
        email: subscriptionData?.user_id, // Assumindo que temos email
        limit: 1,
      })

      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0]

        // Buscar assinaturas do customer
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomer.id,
          status: 'all',
        })

        stripeSubscriptions = subscriptions.data
      }
    } catch (stripeError) {
      // Erro silencioso
    }

    // 3. Calcular acesso
    const hasActiveSubscription =
      subscriptionData?.status === 'active' &&
      new Date(subscriptionData.current_period_end) > new Date()

    const validPurchasedBooks = (purchasedData || []).filter(
      pb => new Date(pb.expires_at) > new Date()
    )

    const hasPurchasedBooks = validPurchasedBooks.length > 0

    const hasAnyAccess = hasActiveSubscription || hasPurchasedBooks

    return NextResponse.json({
      success: true,
      supabase: {
        subscription: subscriptionData,
        purchasedBooks: purchasedData,
        subscriptionError: subscriptionError?.message,
        purchasedError: purchasedError?.message,
      },
      stripe: {
        customer: stripeCustomer,
        subscriptions: stripeSubscriptions,
      },
      access: {
        hasActiveSubscription,
        hasPurchasedBooks,
        hasAnyAccess,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
