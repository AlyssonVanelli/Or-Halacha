import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  console.log('=== SIMULANDO WEBHOOK DE ASSINATURA ===')

  const body = await req.json()
  const { userId, planType = 'monthly' } = body

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
    console.log('Buscando perfil do usuário:', userId)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('ERRO ao buscar perfil:', profileError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar perfil',
          details: profileError,
        },
        { status: 500 }
      )
    }

    if (!profile) {
      console.error('Perfil não encontrado')
      return NextResponse.json(
        {
          success: false,
          error: 'Perfil não encontrado',
        },
        { status: 404 }
      )
    }

    console.log('Perfil encontrado:', profile)

    // Simular dados de assinatura
    const subscriptionData = {
      user_id: profile.id,
      status: 'active' as const,
      plan_type: planType as 'monthly' | 'yearly',
      price_id: `test-price-${planType}`,
      subscription_id: `sub_test_${Date.now()}`,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      cancel_at_period_end: false,
      explicacao_pratica: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Dados da assinatura simulada:', subscriptionData)

    // Inserir assinatura
    const { data: insertResult, error: insertError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (insertError) {
      console.error('ERRO ao inserir assinatura:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao inserir assinatura',
          details: insertError,
        },
        { status: 500 }
      )
    }

    console.log('Assinatura simulada inserida com sucesso:', insertResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura simulada criada com sucesso',
      subscription: insertResult[0],
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
