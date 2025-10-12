import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== DEBUG TRATADO AVULSO ===')
  console.log('Timestamp:', new Date().toISOString())
  
  return NextResponse.json({
    message: 'Debug tratado avulso',
    timestamp: new Date().toISOString(),
    instructions: [
      '1. Faça uma compra de tratado avulso',
      '2. Verifique se aparecem logs com 🎯🎯🎯',
      '3. Se não aparecer, o webhook não está sendo chamado',
      '4. Se aparecer, o problema está na lógica de processamento'
    ],
    webhookUrl: 'https://or-halacha.vercel.app/api/webhooks/stripe',
    expectedEvent: 'checkout.session.completed'
  })
}
