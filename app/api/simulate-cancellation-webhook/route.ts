import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  console.log('=== SIMULANDO WEBHOOK DE CANCELAMENTO ===')

  const body = await req.json()
  const { userId, subscriptionId } = body

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId é obrigatório',
      },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Perfil não encontrado',
        },
        { status: 404 }
      )
    }

    console.log('Perfil encontrado:', profile)

    // Simular dados de cancelamento do Stripe
    const subscriptionData = {
      user_id: profile.id,
      status: 'canceled' as const,
      plan_type: 'yearly' as const,
      price_id: 'price_test_yearly',
      subscription_id: subscriptionId || `sub_canceled_${Date.now()}`,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: true,
      explicacao_pratica: false,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log('Dados de cancelamento:', subscriptionData)

    // Atualizar assinatura no banco
    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (updateError) {
      console.error('ERRO ao cancelar assinatura:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao cancelar assinatura',
          details: updateError,
        },
        { status: 500 }
      )
    }

    console.log('Assinatura cancelada via webhook simulado:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Webhook de cancelamento simulado com sucesso',
      subscription: updateResult[0],
    })
  } catch (error) {
    console.error('ERRO geral na simulação:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral na simulação',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
