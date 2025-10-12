import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  try {
    console.log('=== VERIFICANDO STATUS DO WEBHOOK ===')

    // Listar webhooks configurados
    const webhooks = await stripe.webhookEndpoints.list()

    console.log('Webhooks encontrados:', webhooks.data.length)

    const webhookInfo = webhooks.data.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      enabled_events: webhook.enabled_events,
      status: webhook.status,
      created: new Date(webhook.created * 1000).toISOString(),
    }))

    console.log('Detalhes dos webhooks:', webhookInfo)

    // Verificar se há webhook configurado para nossa URL
    const expectedUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://or-halacha.vercel.app/api/webhooks/stripe'
        : 'http://localhost:3000/api/webhooks/stripe'

    const ourWebhook = webhooks.data.find(webhook => webhook.url === expectedUrl)

    console.log('URL esperada:', expectedUrl)
    console.log('Webhook encontrado:', !!ourWebhook)

    if (ourWebhook) {
      console.log('Webhook configurado:', {
        id: ourWebhook.id,
        url: ourWebhook.url,
        status: ourWebhook.status,
        enabled_events: ourWebhook.enabled_events,
      })

      // Verificar se tem o evento checkout.session.completed
      const hasCheckoutEvent = ourWebhook.enabled_events.includes('checkout.session.completed')
      console.log('Tem evento checkout.session.completed?', hasCheckoutEvent)
    }

    return NextResponse.json({
      success: true,
      webhooks: webhookInfo,
      ourWebhook: ourWebhook
        ? {
            id: ourWebhook.id,
            url: ourWebhook.url,
            status: ourWebhook.status,
            enabled_events: ourWebhook.enabled_events,
            hasCheckoutEvent: ourWebhook.enabled_events.includes('checkout.session.completed'),
          }
        : null,
      expectedUrl,
      message: 'Status do webhook verificado',
    })
  } catch (error) {
    console.error('Erro ao verificar webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
