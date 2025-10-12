import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    console.log('🎭 SIMULANDO EVENTO CHECKOUT.SESSION.COMPLETED')
    
    const { userId, divisionId, bookId } = await req.json()
    
    // Simular evento checkout.session.completed
    const mockEvent = {
      id: 'evt_test_' + Date.now(),
      object: 'event',
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          object: 'checkout.session',
          mode: 'payment',
          status: 'complete',
          payment_status: 'paid',
          customer: 'cus_test_' + Date.now(),
          customer_email: 'test@example.com',
          amount_total: 2990,
          currency: 'brl',
          success_url: 'https://or-halacha.vercel.app/payment/success',
          cancel_url: 'https://or-halacha.vercel.app/dashboard',
          metadata: {
            userId,
            divisionId,
            bookId,
            type: 'treatise-purchase'
          },
          payment_intent: 'pi_test_' + Date.now()
        }
      }
    }
    
    console.log('Evento simulado:', JSON.stringify(mockEvent, null, 2))
    
    // Chamar o webhook diretamente
    const webhookUrl = 'https://or-halacha.vercel.app/api/webhooks/stripe'
    console.log('Chamando webhook:', webhookUrl)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(mockEvent)
    })
    
    const result = await response.text()
    console.log('Resposta do webhook:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Evento simulado enviado para webhook',
      webhookResponse: result,
      event: mockEvent
    })
    
  } catch (error) {
    console.error('Erro na simulação:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
