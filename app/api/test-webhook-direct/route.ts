import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  console.log('=== TESTE DIRETO DO WEBHOOK (SEM STRIPE) ===')
  console.log('Timestamp:', new Date().toISOString())

  const supabase = createClient()

  // Simular dados de uma assinatura real
  const subscriptionData = {
    user_id: '3f0e0184-c0a7-487e-b611-72890b39dcce',
    status: 'active',
    plan_type: 'monthly' as 'monthly' | 'yearly',
    price_id: 'price_1RQCodFLuMsSi0YiE0JiHq40',
    subscription_id: 'sub_test_' + Date.now(),
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false,
    explicacao_pratica: false,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  console.log('=== VERIFICANDO CONEXÃO COM BANCO ===')
  try {
    const { data: testData, error: testError } = await supabase
      .from('subscriptions')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('ERRO na conexão com banco:', testError)
    } else {
      console.log('Conexão com banco OK')
    }
  } catch (err) {
    console.error('ERRO geral na conexão:', err)
  }

  console.log('=== CRIANDO DADOS DA ASSINATURA ===')
  console.log('User ID:', subscriptionData.user_id)
  console.log('Plan Type:', subscriptionData.plan_type)
  console.log('Price ID:', subscriptionData.price_id)
  console.log('Subscription ID:', subscriptionData.subscription_id)
  console.log('Current Period Start:', subscriptionData.current_period_start)
  console.log('Current Period End:', subscriptionData.current_period_end)

  console.log('Dados da assinatura:', subscriptionData)

  console.log('=== INSERINDO ASSINATURA NO BANCO ===')
  console.log('Tentando inserir dados:', JSON.stringify(subscriptionData, null, 2))

  try {
    const { data: insertResult, error: insertError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (insertError) {
      console.error('ERRO ao inserir/atualizar assinatura:', insertError)
      console.error('Detalhes do erro:', JSON.stringify(insertError, null, 2))
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    } else {
      console.log('SUCESSO! Assinatura inserida/atualizada:')
      console.log('Resultado:', JSON.stringify(insertResult, null, 2))
      console.log('Quantidade de registros afetados:', insertResult?.length || 0)
      return NextResponse.json({ success: true, data: insertResult })
    }
  } catch (err) {
    console.error('ERRO GERAL:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
