import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== TESTE DE WEBHOOK ===')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Stripe Secret Key configurado:', !!process.env.STRIPE_SECRET_KEY)
  console.log('Stripe Webhook Secret configurado:', !!process.env.STRIPE_WEBHOOK_SECRET)
  console.log('Supabase URL configurado:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Supabase Anon Key configurado:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return NextResponse.json({
    message: 'Teste de webhook realizado',
    timestamp: new Date().toISOString(),
    config: {
      stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  })
}
