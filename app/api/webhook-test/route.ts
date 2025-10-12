import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('🚨🚨🚨 WEBHOOK TEST CHAMADO 🚨🚨🚨')
  console.log('Timestamp:', new Date().toISOString())
  console.log('URL:', req.url)
  console.log('Method:', req.method)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  
  const body = await req.text()
  console.log('Body length:', body.length)
  console.log('Body preview:', body.substring(0, 500))
  
  return NextResponse.json({ 
    received: true, 
    timestamp: new Date().toISOString(),
    message: 'Webhook test recebido com sucesso'
  })
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook test endpoint ativo',
    timestamp: new Date().toISOString()
  })
}
