import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTE MANUAL DE CANCELAMENTO ===')

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId é obrigatório' }, { status: 400 })
    }

    console.log('Subscription ID:', subscriptionId)

    const supabase = createClient()

    // 1. Verificar status atual no banco
    console.log('\n--- VERIFICANDO STATUS ATUAL NO BANCO ---')
    const { data: currentSub, error: currentError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single()

    if (currentError) {
      console.error('❌ Erro ao buscar subscription:', currentError)
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription não encontrada no banco',
          details: currentError,
        },
        { status: 404 }
      )
    }

    console.log('✅ Subscription encontrada no banco:')
    console.log('- ID:', currentSub.id)
    console.log('- Status:', currentSub.status)
    console.log('- Current Period Start:', currentSub.current_period_start)
    console.log('- Current Period End:', currentSub.current_period_end)
    console.log('- Cancel At Period End:', currentSub.cancel_at_period_end)

    // 2. Simular cancelamento manual
    console.log('\n--- SIMULANDO CANCELAMENTO MANUAL ---')
    const updateData = {
      status: 'canceled' as const,
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    }

    console.log('Dados para atualização:', updateData)

    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('subscription_id', subscriptionId)
      .select()

    if (updateError) {
      console.error('❌ Erro ao cancelar subscription:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao cancelar subscription no banco',
          details: updateError,
        },
        { status: 500 }
      )
    }

    console.log('✅ Subscription cancelada no banco:', updateResult)

    // 3. Verificar se foi atualizada
    console.log('\n--- VERIFICANDO ATUALIZAÇÃO ---')
    const { data: verifySub, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single()

    if (verifyError) {
      console.error('❌ Erro ao verificar subscription:', verifyError)
    } else {
      console.log('✅ Subscription verificada:')
      console.log('- Status:', verifySub.status)
      console.log('- Cancel At Period End:', verifySub.cancel_at_period_end)
      console.log('- Updated At:', verifySub.updated_at)
    }

    return NextResponse.json({
      success: true,
      message: 'Cancelamento simulado com sucesso',
      data: {
        before: {
          status: currentSub.status,
          cancel_at_period_end: currentSub.cancel_at_period_end,
        },
        after: {
          status: verifySub?.status,
          cancel_at_period_end: verifySub?.cancel_at_period_end,
        },
      },
    })
  } catch (error) {
    console.error('Erro geral no teste de cancelamento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
