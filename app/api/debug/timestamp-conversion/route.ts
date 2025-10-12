import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTANDO CONVERSÃO DE TIMESTAMPS ===')

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId é obrigatório' }, { status: 400 })
    }

    console.log('Subscription ID:', subscriptionId)

    // Buscar assinatura no Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

    console.log('Dados brutos do Stripe:')
    console.log('- Status:', stripeSubscription.status)
    console.log('- Current Period Start (raw):', (stripeSubscription as any).current_period_start)
    console.log('- Current Period End (raw):', (stripeSubscription as any).current_period_end)
    console.log('- Cancel At Period End:', stripeSubscription.cancel_at_period_end)
    console.log('- Canceled At:', stripeSubscription.canceled_at)

    // Testar conversões
    const conversions = {
      current_period_start: {
        raw: (stripeSubscription as any).current_period_start,
        converted: (stripeSubscription as any).current_period_start
          ? new Date((stripeSubscription as any).current_period_start * 1000).toISOString()
          : null,
        timestamp: (stripeSubscription as any).current_period_start
          ? new Date((stripeSubscription as any).current_period_start * 1000).getTime()
          : null,
        readable: (stripeSubscription as any).current_period_start
          ? new Date((stripeSubscription as any).current_period_start * 1000).toLocaleString(
              'pt-BR'
            )
          : null,
      },
      current_period_end: {
        raw: (stripeSubscription as any).current_period_end,
        converted: (stripeSubscription as any).current_period_end
          ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
          : null,
        timestamp: (stripeSubscription as any).current_period_end
          ? new Date((stripeSubscription as any).current_period_end * 1000).getTime()
          : null,
        readable: (stripeSubscription as any).current_period_end
          ? new Date((stripeSubscription as any).current_period_end * 1000).toLocaleString('pt-BR')
          : null,
      },
    }

    console.log('\nConversões:')
    console.log('Current Period Start:')
    console.log('- Raw:', conversions.current_period_start.raw)
    console.log('- Converted:', conversions.current_period_start.converted)
    console.log('- Timestamp:', conversions.current_period_start.timestamp)
    console.log('- Readable:', conversions.current_period_start.readable)

    console.log('Current Period End:')
    console.log('- Raw:', conversions.current_period_end.raw)
    console.log('- Converted:', conversions.current_period_end.converted)
    console.log('- Timestamp:', conversions.current_period_end.timestamp)
    console.log('- Readable:', conversions.current_period_end.readable)

    // Verificar se as datas são válidas
    const validation = {
      startValid:
        conversions.current_period_start.raw &&
        conversions.current_period_start.raw > 0 &&
        new Date(conversions.current_period_start.raw * 1000).getTime() > 0,
      endValid:
        conversions.current_period_end.raw &&
        conversions.current_period_end.raw > 0 &&
        new Date(conversions.current_period_end.raw * 1000).getTime() > 0,
      startInFuture:
        conversions.current_period_start.raw &&
        conversions.current_period_start.raw > Math.floor(Date.now() / 1000),
      endInFuture:
        conversions.current_period_end.raw &&
        conversions.current_period_end.raw > Math.floor(Date.now() / 1000),
    }

    console.log('\nValidações:')
    console.log('- Start Valid:', validation.startValid)
    console.log('- End Valid:', validation.endValid)
    console.log('- Start In Future:', validation.startInFuture)
    console.log('- End In Future:', validation.endInFuture)

    // Testar inserção no banco (simulação)
    const subscriptionData = {
      status: stripeSubscription.status,
      current_period_start: conversions.current_period_start.converted,
      current_period_end: conversions.current_period_end.converted,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    }

    console.log('\nDados para inserção no banco:')
    console.log(JSON.stringify(subscriptionData, null, 2))

    return NextResponse.json({
      success: true,
      data: {
        stripe: {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: (stripeSubscription as any).current_period_start,
          current_period_end: (stripeSubscription as any).current_period_end,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          canceled_at: stripeSubscription.canceled_at,
        },
        conversions,
        validation,
        subscriptionData,
      },
    })
  } catch (error) {
    console.error('Erro no teste de conversão:', error)
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
