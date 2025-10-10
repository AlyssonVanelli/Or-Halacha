import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

// Interface para subscription com propriedades específicas
interface StripeSubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start: number
  current_period_end: number
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const customerId = paymentIntent.customer as string

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (profileError || !profile) {
        break
      }

      const purchaseType = paymentIntent.metadata?.type
      const divisionId = paymentIntent.metadata?.divisionId
      const bookId = paymentIntent.metadata?.bookId

      // Verificar se é compra única de tratado
      if (purchaseType === 'treatise-purchase' && divisionId && bookId) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        const purchaseData = {
          user_id: profile.id,
          book_id: bookId,
          division_id: divisionId,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        }

        const { data: insertData, error: purchaseError } = await supabase
          .from('purchased_books')
          .upsert(purchaseData, { onConflict: 'user_id,division_id' })
          .select()

        if (purchaseError) {
        } else {
        }

        return NextResponse.json({ received: true })
      } else {
      }

      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (profileError || !profile) {
        break
      }

      const purchaseType = subscription.metadata?.type
      const planType = subscription.metadata?.planType

      // IGNORAR compras únicas que aparecem como subscription
      if (purchaseType === 'treatise-purchase') {
        return NextResponse.json({ received: true })
      }

      // IGNORAR tratados avulsos antigos
      if (planType === 'tratado-avulso') {
        return NextResponse.json({ received: true })
      }

      const subscriptionData = {
        user_id: profile.id,
        status: subscription.status,
        plan_type: planType as 'monthly' | 'yearly',
        price_id: subscription.items.data[0]?.price?.id || '',
        subscription_id: subscription.id,
        current_period_start: (subscription as StripeSubscriptionWithPeriods).current_period_start
          ? new Date(
              (subscription as StripeSubscriptionWithPeriods).current_period_start * 1000
            ).toISOString()
          : null,
        current_period_end: (subscription as StripeSubscriptionWithPeriods).current_period_end
          ? new Date(
              (subscription as StripeSubscriptionWithPeriods).current_period_end * 1000
            ).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        explicacao_pratica: false,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      const { data: insertData, error: insertError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' })
        .select()

      if (insertError) {
      } else {
      }

      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
