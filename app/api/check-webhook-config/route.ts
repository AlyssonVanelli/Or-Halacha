import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  try {
    console.log('🔍 VERIFICANDO CONFIGURAÇÃO DO WEBHOOK')

    // Listar webhooks
    const webhooks = await stripe.webhookEndpoints.list()
    console.log('Webhooks encontrados:', webhooks.data.length)

    const webhookInfo = webhooks.data.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      enabled_events: webhook.enabled_events,
      status: webhook.status,
      created: new Date(webhook.created * 1000).toISOString(),
    }))

    console.log('Webhooks:', JSON.stringify(webhookInfo, null, 2))

    // Verificar se existe webhook para or-halacha.vercel.app
    const productionWebhook = webhooks.data.find(
      w => w.url.includes('or-halacha.vercel.app') && w.url.includes('/api/webhooks/stripe')
    )

    console.log('Webhook de produção encontrado:', !!productionWebhook)
    if (productionWebhook) {
      console.log('URL:', productionWebhook.url)
      console.log('Status:', productionWebhook.status)
      console.log('Eventos habilitados:', productionWebhook.enabled_events)
    }

    return NextResponse.json({
      webhooks: webhookInfo,
      productionWebhook: productionWebhook
        ? {
            id: productionWebhook.id,
            url: productionWebhook.url,
            status: productionWebhook.status,
            enabled_events: productionWebhook.enabled_events,
          }
        : null,
      message: 'Verificação de webhook concluída',
    })
  } catch (error) {
    console.error('Erro ao verificar webhook:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
