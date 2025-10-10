import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

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
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Buscar profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (!profile) {
        break
      }

      const planType = subscription.metadata?.planType
      const divisionId = subscription.metadata?.divisionId
      const bookId = subscription.metadata?.bookId

      // Se é tratado avulso, salvar apenas na purchased_books
      if (planType === 'tratado-avulso' && divisionId && bookId) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        const purchaseData = {
          user_id: profile.id,
          book_id: bookId,
          division_id: divisionId,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        }

        const { error: purchaseError } = await supabase
          .from('purchased_books')
          .upsert(purchaseData, { onConflict: 'user_id,division_id' })

        if (purchaseError) {
        } else {
        }

        return NextResponse.json({ received: true })
      }

      // Para assinaturas normais, processar normalmente
      break
    }

    default:
  }

  return NextResponse.json({ received: true })
}
