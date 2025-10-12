import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { subscriptionService } from '@/lib/services/subscription-service'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ATIVANDO ASSINATURA DE TESTE ===')

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId é obrigatório' }, { status: 400 })
    }

    console.log('Subscription ID:', subscriptionId)

    // 1. Buscar subscription no Stripe
    console.log('\n--- BUSCANDO SUBSCRIPTION NO STRIPE ---')
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    console.log('✅ Subscription encontrada:', subscription.id)
    console.log('Status atual:', subscription.status)
    console.log('Current Period Start:', (subscription as any).current_period_start)
    console.log('Current Period End:', (subscription as any).current_period_end)

    // 2. Se estiver incomplete, ativar manualmente
    if (subscription.status === 'incomplete') {
      console.log('\n--- ATIVANDO SUBSCRIPTION ---')

      try {
        // Atualizar subscription para active
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          metadata: {
            ...subscription.metadata,
            activated: 'true',
            activated_at: new Date().toISOString(),
          },
        })

        console.log('✅ Subscription ativada:', updatedSubscription.id)
        console.log('Novo status:', updatedSubscription.status)
        console.log('Current Period Start:', (updatedSubscription as any).current_period_start)
        console.log('Current Period End:', (updatedSubscription as any).current_period_end)

        // 3. Sincronizar com banco
        console.log('\n--- SINCRONIZANDO COM BANCO ---')
        const result = await subscriptionService.syncWithStripe(subscriptionId)

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
            message: 'Subscription ativada e sincronizada com sucesso',
            data: {
              stripe: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                current_period_start: (updatedSubscription as any).current_period_start,
                current_period_end: (updatedSubscription as any).current_period_end,
              },
              database: {
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
              error: 'Falha na sincronização com banco',
              data: {
                stripeSubscriptionId: updatedSubscription.id,
                stripeStatus: updatedSubscription.status,
              },
            },
            { status: 500 }
          )
        }
      } catch (updateError) {
        console.error('❌ Erro ao ativar subscription:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao ativar subscription',
            details: updateError instanceof Error ? updateError.message : 'Erro desconhecido',
          },
          { status: 500 }
        )
      }
    } else {
      console.log('✅ Subscription já está ativa:', subscription.status)

      // Sincronizar mesmo assim
      const result = await subscriptionService.syncWithStripe(subscriptionId)

      if (result) {
        return NextResponse.json({
          success: true,
          message: 'Subscription já estava ativa e foi sincronizada',
          data: {
            stripe: {
              id: subscription.id,
              status: subscription.status,
              current_period_start: (subscription as any).current_period_start,
              current_period_end: (subscription as any).current_period_end,
            },
            database: {
              id: result.id,
              status: result.status,
              current_period_start: result.current_period_start,
              current_period_end: result.current_period_end,
              explicacao_pratica: result.explicacao_pratica,
            },
          },
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Falha na sincronização',
            data: {
              stripeSubscriptionId: subscription.id,
              stripeStatus: subscription.status,
            },
          },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Erro geral na ativação de subscription:', error)
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
