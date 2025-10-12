import { NextRequest, NextResponse } from 'next/server'
// import { subscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CRIANDO ASSINATURA ATIVA DIRETAMENTE NO BANCO ===')

    const { userId, planType = 'yearly', isPlus = false } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    console.log('User ID:', userId)
    console.log('Plan Type:', planType)
    console.log('Is Plus:', isPlus)

    const supabase = createClient()

    // 1. Verificar se usuário existe
    console.log('\n--- VERIFICANDO USUÁRIO ---')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Usuário não encontrado:', profileError)
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado',
          details: profileError,
        },
        { status: 404 }
      )
    }

    console.log('✅ Usuário encontrado:', profile.id)

    // 2. Calcular datas
    console.log('\n--- CALCULANDO DATAS ---')
    const now = new Date()
    const startDate = now.toISOString()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias

    console.log('Start Date:', startDate)
    console.log('End Date:', endDate)

    // 3. Criar subscription diretamente no banco
    console.log('\n--- CRIANDO SUBSCRIPTION NO BANCO ---')
    const subscriptionData = {
      user_id: userId,
      status: 'active',
      plan_type: planType,
      price_id: isPlus ? 'price_plus_test' : 'price_normal_test',
      subscription_id: `sub_test_${Date.now()}`,
      current_period_start: startDate,
      current_period_end: endDate,
      cancel_at_period_end: false,
      explicacao_pratica: isPlus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Dados da subscription:', JSON.stringify(subscriptionData, null, 2))

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Erro ao criar subscription:', subscriptionError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar subscription no banco',
          details: subscriptionError,
        },
        { status: 500 }
      )
    }

    console.log('✅ Subscription criada no banco:', subscription.id)

    // 4. Verificar se foi salva corretamente
    console.log('\n--- VERIFICANDO DADOS SALVOS ---')
    const { data: savedSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single()

    if (fetchError || !savedSubscription) {
      console.error('❌ Erro ao buscar subscription salva:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar subscription salva',
          details: fetchError,
        },
        { status: 500 }
      )
    }

    console.log('✅ Subscription verificada no banco')
    console.log('Dados salvos:', {
      id: savedSubscription.id,
      status: savedSubscription.status,
      plan_type: savedSubscription.plan_type,
      current_period_start: savedSubscription.current_period_start,
      current_period_end: savedSubscription.current_period_end,
      explicacao_pratica: savedSubscription.explicacao_pratica,
    })

    // 5. Verificar se tudo está correto
    const isCorrect =
      savedSubscription.status === 'active' &&
      savedSubscription.current_period_start !== null &&
      savedSubscription.current_period_end !== null &&
      savedSubscription.explicacao_pratica === isPlus

    if (isCorrect) {
      console.log('✅ ASSINATURA CRIADA CORRETAMENTE!')
      return NextResponse.json({
        success: true,
        message: 'Subscription criada e salva corretamente no banco',
        data: {
          subscription: {
            id: savedSubscription.id,
            status: savedSubscription.status,
            plan_type: savedSubscription.plan_type,
            current_period_start: savedSubscription.current_period_start,
            current_period_end: savedSubscription.current_period_end,
            explicacao_pratica: savedSubscription.explicacao_pratica,
          },
          verification: {
            statusActive: savedSubscription.status === 'active',
            hasStartDate: savedSubscription.current_period_start !== null,
            hasEndDate: savedSubscription.current_period_end !== null,
            isPlusCorrect: savedSubscription.explicacao_pratica === isPlus,
            allCorrect: isCorrect,
          },
        },
      })
    } else {
      console.error('❌ DADOS INCORRETOS APÓS SALVAR')
      return NextResponse.json(
        {
          success: false,
          error: 'Dados incorretos após salvar no banco',
          data: {
            subscription: savedSubscription,
            expected: {
              status: 'active',
              explicacao_pratica: isPlus,
            },
            verification: {
              statusActive: savedSubscription.status === 'active',
              hasStartDate: savedSubscription.current_period_start !== null,
              hasEndDate: savedSubscription.current_period_end !== null,
              isPlusCorrect: savedSubscription.explicacao_pratica === isPlus,
              allCorrect: isCorrect,
            },
          },
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro geral na criação de subscription ativa:', error)
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
