import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  try {
    console.log('=== VERIFICANDO EVENTOS DO WEBHOOK ===')
    
    // Listar webhooks
    const webhooks = await stripe.webhookEndpoints.list()
    
    const productionUrl = 'https://or-halacha.vercel.app/api/webhooks/stripe'
    
    // Encontrar o webhook de produção
    const productionWebhook = webhooks.data.find(webhook => 
      webhook.url === productionUrl
    )
    
    console.log('URL de produção:', productionUrl)
    console.log('Webhook encontrado:', !!productionWebhook)
    
    if (productionWebhook) {
      console.log('Webhook de produção:', {
        id: productionWebhook.id,
        url: productionWebhook.url,
        status: productionWebhook.status,
        enabled_events: productionWebhook.enabled_events,
        created: new Date(productionWebhook.created * 1000).toISOString(),
      })
      
      // Verificar se tem o evento checkout.session.completed
      const hasCheckoutEvent = productionWebhook.enabled_events.includes('checkout.session.completed')
      console.log('Tem evento checkout.session.completed?', hasCheckoutEvent)
      
      // Verificar se está ativo
      const isActive = productionWebhook.status === 'enabled'
      console.log('Webhook está ativo?', isActive)
      
      return NextResponse.json({
        success: true,
        webhook: {
          id: productionWebhook.id,
          url: productionWebhook.url,
          status: productionWebhook.status,
          enabled_events: productionWebhook.enabled_events,
          hasCheckoutEvent,
          isActive,
          created: new Date(productionWebhook.created * 1000).toISOString(),
        },
        message: 'Webhook de produção verificado'
      })
    } else {
      console.log('❌ Webhook de produção não encontrado!')
      return NextResponse.json({
        success: false,
        error: 'Webhook de produção não encontrado',
        expectedUrl: productionUrl,
        availableWebhooks: webhooks.data.map(w => ({
          id: w.id,
          url: w.url,
          status: w.status,
          enabled_events: w.enabled_events
        }))
      }, { status: 404 })
    }
    
  } catch (error) {
    console.error('Erro ao verificar webhook:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
