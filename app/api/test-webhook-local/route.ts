import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('🧪 TESTE LOCAL DO WEBHOOK')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Headers:', Object.fromEntries(req.headers.entries()))

  const body = await req.text()
  console.log('Body recebido:', body.substring(0, 500))

  return NextResponse.json({
    received: true,
    timestamp: new Date().toISOString(),
    message: 'Teste local do webhook funcionando',
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de teste local ativo',
    timestamp: new Date().toISOString(),
    webhookUrl: 'http://localhost:3000/api/webhooks/stripe',
    instructions: [
      '1. Configure esta URL no Stripe Dashboard',
      '2. Adicione o evento checkout.session.completed',
      '3. Teste uma compra para ver os logs',
    ],
  })
}
