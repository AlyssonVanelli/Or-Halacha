import { NextResponse } from 'next/server'

export async function POST() {
  console.log('=== FORÇANDO CHAMADA DO WEBHOOK ===')

  // Simular dados reais do Stripe
  const mockStripeEvent = {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    type: 'customer.subscription.created',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_' + Date.now(),
        object: 'subscription',
        status: 'active',
        customer: 'cus_TDchuNP6TWPMSH',
        items: {
          data: [
            {
              price: {
                id: 'price_1RQCodFLuMsSi0YiE0JiHq40',
              },
            },
          ],
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        cancel_at_period_end: false,
        metadata: {
          planType: 'mensal-plus',
        },
      },
    },
  }

  console.log('Dados do evento Stripe:', JSON.stringify(mockStripeEvent, null, 2))

  // Chamar o webhook interno
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockStripeEvent),
    })

    const result = await response.text()
    console.log('Resposta do webhook:', result)

    return NextResponse.json({
      success: true,
      message: 'Webhook chamado com sucesso',
      result,
    })
  } catch (error) {
    console.error('Erro ao chamar webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
