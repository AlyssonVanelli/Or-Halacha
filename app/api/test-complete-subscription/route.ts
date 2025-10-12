import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { subscriptionService } from '@/lib/services/subscription-service'

export async function POST(request: NextRequest) {
  try {
    console.log('=== COMPLETANDO ASSINATURA COM DADOS CORRETOS ===')

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

    // 2. Simular pagamento bem-sucedido e ativar
    console.log('\n--- SIMULANDO PAGAMENTO E ATIVANDO ---')

    // Calcular datas corretas
    const now = Math.floor(Date.now() / 1000)
    const periodStart = now
    const periodEnd = now + 30 * 24 * 60 * 60 // 30 dias para teste

    console.log('Datas calculadas:')
    console.log('- Period Start:', periodStart, new Date(periodStart * 1000).toISOString())
    console.log('- Period End:', periodEnd, new Date(periodEnd * 1000).toISOString())

    // 3. Simular pagamento bem-sucedido (não podemos atualizar status diretamente)
    console.log('\n--- SIMULANDO PAGAMENTO BEM-SUCEDIDO ---')

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

    // Atualizar apenas metadata (não podemos mudar status diretamente)
    console.log('\n--- ATUALIZANDO METADATA ---')
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      metadata: {
        ...subscription.metadata,
        activated: 'true',
        activated_at: new Date().toISOString(),
        test_mode: 'true',
        period_start: periodStart.toString(),
        period_end: periodEnd.toString(),
      },
    })

    console.log('✅ Subscription atualizada no Stripe')
    console.log('Novo status:', updatedSubscription.status)
    console.log('Current Period Start:', (updatedSubscription as any).current_period_start)
    console.log('Current Period End:', (updatedSubscription as any).current_period_end)

    // 4. Sincronizar com banco
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

      // 5. Verificar se as datas estão corretas
      const datesCorrect =
        result.current_period_start !== null &&
        result.current_period_end !== null &&
        result.status === 'active'

      if (datesCorrect) {
        console.log('✅ DATAS E STATUS CORRETOS!')
        return NextResponse.json({
          success: true,
          message: 'Subscription completada e sincronizada com sucesso',
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
            error: 'Datas ainda não estão corretas após sincronização',
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
  } catch (error) {
    console.error('Erro geral na completação de subscription:', error)
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
