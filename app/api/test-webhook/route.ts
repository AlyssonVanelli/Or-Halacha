import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint',
    timestamp: new Date().toISOString(),
    instructions: [
      '1. Configure o webhook no Stripe Dashboard',
      '2. URL: https://seu-dominio.com/api/webhooks/stripe',
      '3. Eventos: checkout.session.completed',
      '4. Teste com: stripe listen --forward-to localhost:3000/api/webhooks/stripe',
    ],
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'Webhook test POST',
    timestamp: new Date().toISOString(),
    note: 'Este endpoint pode ser usado para testar se o webhook está funcionando',
  })
}
