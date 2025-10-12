import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  try {
    console.log('=== VERIFICANDO WEBHOOKS DO STRIPE ===')
    
    // Listar todos os webhooks
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
    
    return NextResponse.json({
      success: true,
      webhooks: webhookInfo,
      count: webhooks.data.length,
      message: 'Webhooks do Stripe listados com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao listar webhooks:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
