import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CRIANDO ASSINATURA DE TESTE DIRETAMENTE NO BANCO ===')

    const { userId, planType = 'yearly', isPlus = false } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    console.log('User ID:', userId)
    console.log('Plan Type:', planType)
    console.log('Is Plus:', isPlus)

    const supabase = createClient()

    // 1. Verificar se usuário existe
    console.log('\n--- VERIFICANDO USUÁRIO ---')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Usuário não encontrado:', profileError)
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

    // 2. Criar customer no Stripe se não existir
    console.log('\n--- VERIFICANDO/CRIANDO CUSTOMER ---')
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      console.log('Criando customer no Stripe...')
      try {
        const { stripe } = await import('@/lib/stripe')
        const customer = await stripe.customers.create({
          email: profile.email || `user-${userId}@test.com`,
          metadata: {
            user_id: userId,
          },
        })
        customerId = customer.id
        console.log('✅ Customer criado:', customerId)

        // Atualizar perfil
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

    // 3. Criar subscription no Stripe
    console.log('\n--- CRIANDO SUBSCRIPTION NO STRIPE ---')
    try {
      const { stripe } = await import('@/lib/stripe')

      // Buscar price ID baseado no tipo
      const priceId = isPlus
        ? 'price_1RQCoOFLuMsSi0YiBmCrrM1r' // Seu price ID Plus
        : 'price_1RQCoOFLuMsSi0YiBmCrrM1r' // Seu price ID normal

      console.log('Price ID:', priceId)

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          test: 'true',
        },
      })

      console.log('✅ Subscription criada no Stripe:', subscription.id)
      console.log('Status:', subscription.status)
      console.log('Current Period Start:', (subscription as any).current_period_start)
      console.log('Current Period End:', (subscription as any).current_period_end)

      // 4. Salvar no banco usando o service
      console.log('\n--- SALVANDO NO BANCO ---')
      try {
        const result = await subscriptionService.syncWithStripe(subscription.id)

        if (result) {
          console.log('✅ Subscription salva no banco com sucesso')
          console.log('Dados salvos:', {
            id: result.id,
            status: result.status,
            plan_type: result.plan_type,
            current_period_start: result.current_period_start,
            current_period_end: result.current_period_end,
            explicacao_pratica: result.explicacao_pratica,
          })

          return NextResponse.json({
            success: true,
            message: 'Subscription criada e salva com sucesso',
            data: {
              stripe: {
                id: subscription.id,
                status: subscription.status,
                customer: subscription.customer,
                current_period_start: (subscription as any).current_period_start,
                current_period_end: (subscription as any).current_period_end,
              },
              database: {
                id: result.id,
                status: result.status,
                plan_type: result.plan_type,
                current_period_start: result.current_period_start,
                current_period_end: result.current_period_end,
                explicacao_pratica: result.explicacao_pratica,
              },
            },
          })
        } else {
          console.error('❌ Falha ao salvar no banco')
          return NextResponse.json(
            {
              success: false,
              error: 'Falha ao salvar subscription no banco',
              data: {
                stripeSubscriptionId: subscription.id,
                stripeStatus: subscription.status,
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
            error: 'Erro na sincronização com banco',
            details: syncError instanceof Error ? syncError.message : 'Erro desconhecido',
          },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('❌ Erro ao criar subscription no Stripe:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar subscription no Stripe',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro geral na criação de subscription:', error)
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
