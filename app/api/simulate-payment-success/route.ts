import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { subscriptionService } from '@/lib/services/subscription-service'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMULANDO PAGAMENTO BEM-SUCEDIDO ===')

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId é obrigatório' }, { status: 400 })
    }

    console.log('Subscription ID:', subscriptionId)

    // 1. Buscar subscription atual
    console.log('\n--- BUSCANDO SUBSCRIPTION ATUAL ---')
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    console.log('Status atual:', subscription.status)
    console.log('Current Period Start:', (subscription as any).current_period_start)
    console.log('Current Period End:', (subscription as any).current_period_end)

    // 2. Se estiver incomplete, simular pagamento
    if (subscription.status === 'incomplete') {
      console.log('\n--- SIMULANDO PAGAMENTO ---')

      // Buscar o invoice da subscription
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        limit: 1,
      })

      if (invoices.data.length > 0) {
        const invoice = invoices.data[0]
        console.log('Invoice encontrado:', invoice.id)
        console.log('Invoice status:', invoice.status)

        // Marcar invoice como pago
        if (invoice.status !== 'paid') {
          console.log('Marcando invoice como pago...')
          await stripe.invoices.pay(invoice.id!)
          console.log('✅ Invoice marcado como pago')
        }
      }

      // 3. Aguardar um pouco para o Stripe processar
      console.log('Aguardando processamento do Stripe...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 4. Buscar subscription atualizada
      console.log('\n--- VERIFICANDO SUBSCRIPTION ATUALIZADA ---')
      const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      console.log('Novo status:', updatedSubscription.status)
      console.log('Current Period Start:', (updatedSubscription as any).current_period_start)
      console.log('Current Period End:', (updatedSubscription as any).current_period_end)

      // 5. Sincronizar com banco
      console.log('\n--- SINCRONIZANDO COM BANCO ---')
      const result = await subscriptionService.syncWithStripe(subscriptionId)

      if (result) {
        console.log('✅ Subscription sincronizada com sucesso')
        console.log('Dados finais no banco:', {
          id: result.id,
          status: result.status,
          current_period_start: result.current_period_start,
          current_period_end: result.current_period_end,
          explicacao_pratica: result.explicacao_pratica,
        })

        // 6. Verificar se as datas estão corretas
        const datesCorrect =
          result.current_period_start !== null &&
          result.current_period_end !== null &&
          result.status === 'active'

        if (datesCorrect) {
          console.log('✅ DATAS E STATUS CORRETOS!')
          return NextResponse.json({
            success: true,
            message: 'Pagamento simulado e subscription ativada com sucesso',
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
              verification: {
                datesCorrect: datesCorrect,
                statusActive: result.status === 'active',
                hasStartDate: result.current_period_start !== null,
                hasEndDate: result.current_period_end !== null,
              },
            },
          })
        } else {
          console.error('❌ DATAS AINDA INCORRETAS')
          return NextResponse.json(
            {
              success: false,
              error: 'Datas ainda não estão corretas após simulação de pagamento',
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
            },
            { status: 500 }
          )
        }
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
    console.error('Erro geral na simulação de pagamento:', error)
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
