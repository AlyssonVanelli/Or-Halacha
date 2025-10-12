import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  console.log('=== TESTE DE WEBHOOK DE ASSINATURA ===')

  const supabase = createClient()

  try {
    // Testar conexão com banco
    console.log('Testando conexão com banco...')
    const { data: testData, error: testError } = await supabase
      .from('subscriptions')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('ERRO na conexão com banco:', testError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro na conexão com banco',
          details: testError,
        },
        { status: 500 }
      )
    }

    console.log('Conexão com banco OK')

    // Testar inserção de assinatura de teste
    const testSubscriptionData = {
      user_id: 'test-user-id',
      status: 'active' as const,
      plan_type: 'monthly' as const,
      price_id: 'test-price-id',
      subscription_id: 'test-subscription-id',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      explicacao_pratica: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Testando inserção de assinatura...')
    console.log('Dados de teste:', testSubscriptionData)

    const { data: insertResult, error: insertError } = await supabase
      .from('subscriptions')
      .insert(testSubscriptionData)
      .select()

    if (insertError) {
      console.error('ERRO ao inserir assinatura de teste:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao inserir assinatura',
          details: insertError,
        },
        { status: 500 }
      )
    }

    console.log('Assinatura de teste inserida com sucesso:', insertResult)

    // Limpar dados de teste
    await supabase.from('subscriptions').delete().eq('user_id', 'test-user-id')

    console.log('Dados de teste removidos')

    return NextResponse.json({
      success: true,
      message: 'Teste de webhook realizado com sucesso',
      testData: insertResult,
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
