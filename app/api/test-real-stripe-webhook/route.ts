import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { subscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTE DE WEBHOOK REAL DO STRIPE ===')

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId é obrigatório' }, { status: 400 })
    }

    console.log('Session ID:', sessionId)

    // 1. Buscar session no Stripe
    console.log('\n--- BUSCANDO SESSION NO STRIPE ---')
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      console.log('✅ Session encontrada:', session.id)
      console.log('Session status:', session.status)
      console.log('Session mode:', session.mode)
      console.log('Session customer:', session.customer)
      console.log('Session subscription:', session.subscription)
      console.log('Session payment_intent:', session.payment_intent)

      if (session.status !== 'complete') {
        return NextResponse.json(
          {
            success: false,
            error: 'Session não está completa',
            data: {
              sessionId: session.id,
              status: session.status,
              mode: session.mode,
            },
          },
          { status: 400 }
        )
      }

      // 2. Se for subscription, buscar subscription
      if (session.mode === 'subscription' && session.subscription) {
        console.log('\n--- BUSCANDO SUBSCRIPTION ---')
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        console.log('✅ Subscription encontrada:', subscription.id)
        console.log('Subscription status:', subscription.status)
        console.log('Subscription customer:', subscription.customer)
        console.log('Current period start:', (subscription as any).current_period_start)
        console.log('Current period end:', (subscription as any).current_period_end)
        console.log('Cancel at period end:', subscription.cancel_at_period_end)

        // 3. Buscar customer
        console.log('\n--- BUSCANDO CUSTOMER ---')
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        console.log('✅ Customer encontrado:', customer.id)
        console.log('Customer email:', (customer as any).email)

        // 4. Buscar usuário no banco
        console.log('\n--- BUSCANDO USUÁRIO NO BANCO ---')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('stripe_customer_id', customer.id)
          .single()

        if (profileError || !profile) {
          console.error('❌ Usuário não encontrado para customer:', customer.id)
          return NextResponse.json(
            {
              success: false,
              error: 'Usuário não encontrado para customer',
              data: {
                customerId: customer.id,
                customerEmail: (customer as any).email,
              },
            },
            { status: 404 }
          )
        }

        console.log('✅ Usuário encontrado:', profile.id)

        // 5. Sincronizar subscription
        console.log('\n--- SINCRONIZANDO SUBSCRIPTION ---')
        try {
          const result = await subscriptionService.syncWithStripe(subscription.id)

          if (result) {
            console.log('✅ Subscription sincronizada com sucesso')
            console.log('Dados sincronizados:', {
              id: result.id,
              status: result.status,
              current_period_start: result.current_period_start,
              current_period_end: result.current_period_end,
              explicacao_pratica: result.explicacao_pratica,
            })

            return NextResponse.json({
              success: true,
              message: 'Subscription sincronizada com sucesso',
              data: {
                session: {
                  id: session.id,
                  status: session.status,
                  mode: session.mode,
                },
                subscription: {
                  id: subscription.id,
                  status: subscription.status,
                  current_period_start: (subscription as any).current_period_start,
                  current_period_end: (subscription as any).current_period_end,
                },
                customer: {
                  id: customer.id,
                  email: (customer as any).email,
                },
                user: {
                  id: profile.id,
                  stripe_customer_id: profile.stripe_customer_id,
                },
                synced: {
                  id: result.id,
                  status: result.status,
                  current_period_start: result.current_period_start,
                  current_period_end: result.current_period_end,
                  explicacao_pratica: result.explicacao_pratica,
                },
              },
            })
          } else {
            console.error('❌ Falha na sincronização')
            return NextResponse.json(
              {
                success: false,
                error: 'Falha na sincronização da subscription',
                data: {
                  sessionId: session.id,
                  subscriptionId: subscription.id,
                  customerId: customer.id,
                  userId: profile.id,
                },
              },
              { status: 500 }
            )
          }
        } catch (syncError) {
          console.error('❌ Erro na sincronização:', syncError)
          return NextResponse.json(
            {
              success: false,
              error: 'Erro na sincronização',
              details: syncError instanceof Error ? syncError.message : 'Erro desconhecido',
            },
            { status: 500 }
          )
        }
      } else if (session.mode === 'payment' && session.payment_intent) {
        console.log('\n--- PROCESSANDO PAYMENT INTENT ---')
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
        console.log('✅ Payment Intent encontrado:', paymentIntent.id)
        console.log('Payment Intent status:', paymentIntent.status)
        console.log('Payment Intent amount:', paymentIntent.amount)
        console.log('Payment Intent currency:', paymentIntent.currency)

        return NextResponse.json({
          success: true,
          message: 'Payment Intent processado',
          data: {
            session: {
              id: session.id,
              status: session.status,
              mode: session.mode,
            },
            paymentIntent: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
            },
          },
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Session não tem subscription nem payment_intent',
            data: {
              sessionId: session.id,
              mode: session.mode,
              subscription: session.subscription,
              payment_intent: session.payment_intent,
            },
          },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('❌ Erro ao buscar session:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar session no Stripe',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro geral no teste de webhook real:', error)
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
