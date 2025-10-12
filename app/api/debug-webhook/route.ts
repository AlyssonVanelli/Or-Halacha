import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== DEBUG WEBHOOK ===')
  console.log('Timestamp:', new Date().toISOString())

  const config = {
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
  }

  console.log('Configuração:', config)

  return NextResponse.json({
    message: 'Debug webhook',
    timestamp: new Date().toISOString(),
    config,
    webhookUrl:
      process.env.NODE_ENV === 'production'
        ? 'https://or-halacha.vercel.app/api/webhooks/stripe'
        : 'http://localhost:3000/api/webhooks/stripe',
  })
}
