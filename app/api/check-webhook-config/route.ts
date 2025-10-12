import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== VERIFICANDO CONFIGURAÇÃO DO WEBHOOK ===')

  const config = {
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  }

  console.log('Configuração:', config)

  const missingConfigs = Object.entries(config)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missingConfigs.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Configurações faltando',
        missing: missingConfigs,
        config,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Configuração do webhook OK',
    config,
  })
}
