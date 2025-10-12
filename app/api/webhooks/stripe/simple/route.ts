import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook signature ou secret não configurados' },
      { status: 400 }
    )
  }

  const rawBody = Buffer.from(await req.arrayBuffer())
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const supabase = createClient()

  console.log('=== WEBHOOK SIMPLES ===')
  console.log('Event Type:', event.type)
  console.log('Event ID:', event.id)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('=== PROCESSANDO ASSINATURA ===')
        console.log('Subscription ID:', subscription.id)
        console.log('Status:', subscription.status)
        console.log('Customer:', customerId)

        // Buscar profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('❌ Profile não encontrado para customer:', customerId)
          return NextResponse.json({ error: 'Profile não encontrado' }, { status: 404 })
        }

        console.log('✅ Profile encontrado:', profile.id)

        // Determinar status
        let status = subscription.status
        if (event.type === 'customer.subscription.deleted') {
          status = 'canceled'
        }

        // Determinar plan type
        const planType =
          subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

        // Detectar Plus
        let explicacaoPratica = false
        try {
          const sessions = await stripe.checkout.sessions.list({
            subscription: subscription.id,
            limit: 1,
          })

          if (sessions.data.length > 0) {
            const session = sessions.data[0]
            const metadata = session.metadata || {}
            explicacaoPratica =
              metadata.isPlus === 'true' ||
              metadata.planType?.toLowerCase().includes('plus') ||
              false
          }
        } catch (err) {
          console.log('Erro ao buscar session:', err)
        }

        // Se cancelar, explicacao_pratica deve ser false
        if (status === 'canceled') {
          explicacaoPratica = false
        }

        // Datas CORRETAS
        const currentPeriodStart = (subscription as any).current_period_start
          ? new Date((subscription as any).current_period_start * 1000).toISOString()
          : null
        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null

        console.log('Current Period Start:', currentPeriodStart)
        console.log('Current Period End:', currentPeriodEnd)
        console.log('Plan Type:', planType)
        console.log('Explicação Prática:', explicacaoPratica)

        // Upsert simples
        const { data: result, error: upsertError } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: profile.id,
              status: status,
              plan_type: planType,
              price_id: subscription.items.data[0]?.price?.id || '',
              subscription_id: subscription.id,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end,
              explicacao_pratica: explicacaoPratica,
              updated_at: new Date().toISOString(),
              created_at:
                event.type === 'customer.subscription.created'
                  ? new Date().toISOString()
                  : undefined,
            },
            { onConflict: 'user_id' }
          )
          .select()

        if (upsertError) {
          console.error('❌ Erro no upsert:', upsertError)
          return NextResponse.json({ error: 'Erro ao salvar assinatura' }, { status: 500 })
        }

        console.log('✅ Assinatura salva:', result)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'payment') {
          // Compra de tratado individual
          const { divisionId, bookId, userId } = session.metadata || {}

          if (divisionId && userId) {
            console.log('=== PROCESSANDO COMPRA INDIVIDUAL ===')
            console.log('Division ID:', divisionId)
            console.log('User ID:', userId)

            const { data: purchase, error: purchaseError } = await supabase
              .from('purchased_books')
              .upsert(
                {
                  user_id: userId,
                  book_id: bookId || 'shulchan-aruch',
                  division_id: divisionId,
                  purchased_at: new Date().toISOString(),
                  stripe_payment_intent: session.payment_intent,
                },
                { onConflict: 'user_id,division_id' }
              )
              .select()

            if (purchaseError) {
              console.error('❌ Erro ao salvar compra:', purchaseError)
            } else {
              console.log('✅ Compra salva:', purchase)
            }
          }
        }
        break
      }

      default:
        console.log('Evento não tratado:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
