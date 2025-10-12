import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  console.log('=== SIMULANDO WEBHOOK COM DADOS REAIS ===')

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
    // Buscar assinatura no banco
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('ERRO ao buscar assinatura:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinatura',
          details: dbError,
        },
        { status: 500 }
      )
    }

    if (!dbSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assinatura não encontrada',
        },
        { status: 404 }
      )
    }

    console.log('Assinatura atual no banco:', dbSubscription)

    // Simular dados de uma assinatura Plus com datas corretas
    const mockSubscriptionData = {
      user_id: userId,
      status: 'active' as const,
      plan_type: 'yearly' as const,
      price_id: dbSubscription.price_id || 'price_1RQCodFLuMsSi0YiE0JiHq40',
      subscription_id: dbSubscription.subscription_id || 'sub_1SH97zFLuMsSi0YiPSxcTaWL',
      current_period_start: new Date().toISOString(), // Data atual
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano a partir de agora
      cancel_at_period_end: false,
      explicacao_pratica: true, // FORÇAR como Plus
      updated_at: new Date().toISOString(),
    }

    console.log('Dados simulados:', mockSubscriptionData)

    // Atualizar no banco
    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .update(mockSubscriptionData)
      .eq('user_id', userId)
      .select()

    if (updateError) {
      console.error('ERRO ao atualizar:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao atualizar assinatura',
          details: updateError,
        },
        { status: 500 }
      )
    }

    console.log('Assinatura atualizada com sucesso:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura simulada e atualizada com sucesso',
      subscription: updateResult[0],
    })
  } catch (error) {
    console.error('ERRO na simulação:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno na simulação',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
