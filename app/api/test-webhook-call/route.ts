import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('🧪 TESTE DE CHAMADA DO WEBHOOK')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Headers:', Object.fromEntries(req.headers.entries()))

  const body = await req.text()
  console.log('Body recebido:', body)

  return NextResponse.json({
    received: true,
    timestamp: new Date().toISOString(),
    message: 'Webhook test recebido com sucesso',
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de teste do webhook ativo',
    timestamp: new Date().toISOString(),
    webhookUrl:
      process.env.NODE_ENV === 'production'
        ? 'https://or-halacha.vercel.app/api/webhooks/stripe'
        : 'http://localhost:3000/api/webhooks/stripe',
  })
}
