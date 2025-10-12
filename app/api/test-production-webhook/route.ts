import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('🧪 TESTE DO WEBHOOK EM PRODUÇÃO')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  console.log('URL:', req.url)
  console.log('Method:', req.method)
  
  const body = await req.text()
  console.log('Body recebido:', body.substring(0, 500))
  
  return NextResponse.json({ 
    received: true, 
    timestamp: new Date().toISOString(),
    message: 'Webhook de produção funcionando',
    environment: 'production'
  })
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Endpoint de teste do webhook em produção',
    timestamp: new Date().toISOString(),
    webhookUrl: 'https://or-halacha.vercel.app/api/webhooks/stripe',
    environment: 'production'
  })
}
