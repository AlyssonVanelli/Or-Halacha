import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  console.log('=== TESTANDO WEBHOOK REAL COM DATAS ===')

  const body = await req.json()
  const { userId } = body

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

    // Simular dados de assinatura com datas corretas
    const now = new Date()
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    const subscriptionData = {
      user_id: profile.id,
      status: 'active' as const,
      plan_type: 'yearly' as const,
      price_id: 'price_test_yearly',
      subscription_id: `sub_test_${Date.now()}`,
      current_period_start: now.toISOString(),
      current_period_end: oneYearFromNow.toISOString(),
      cancel_at_period_end: false,
      explicacao_pratica: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Dados da assinatura com datas:', subscriptionData)

    // Atualizar assinatura existente ou criar nova
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

    console.log('Assinatura com datas inserida com sucesso:', insertResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura com datas corretas criada',
      subscription: insertResult[0],
    })
  } catch (error) {
    console.error('ERRO geral no teste:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral no teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
