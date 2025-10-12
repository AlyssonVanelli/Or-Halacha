import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { userId, divisionId } = await request.json()

    console.log('🔍 VERIFICAÇÃO DE ACESSO - INÍCIO')
    console.log('User ID:', userId)
    console.log('Division ID:', divisionId)

    if (!userId || !divisionId) {
      console.log('❌ ERRO: userId ou divisionId não fornecidos')
      return NextResponse.json(
        {
          error: 'userId e divisionId são obrigatórios',
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 1. Verificar assinatura ativa (acesso completo)
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (subscriptionError) {
      console.error('Erro ao buscar assinatura:', subscriptionError)
    }

    // Verificar se a assinatura está ativa e não expirou
    const hasActiveSubscription =
      !!subscriptionData &&
      subscriptionData.status === 'active' &&
      (subscriptionData.current_period_end
        ? new Date(subscriptionData.current_period_end) > new Date()
        : true) // Se não tem data de fim, considera ativa

    console.log('Verificação de assinatura:')
    console.log('- Subscription data:', subscriptionData)
    console.log('- Has active subscription:', hasActiveSubscription)
    console.log('- Current period end:', subscriptionData?.current_period_end)
    console.log('- Current date:', new Date().toISOString())

    // 2. Verificar se esta divisão específica foi comprada
    console.log('🔍 VERIFICANDO COMPRAS ESPECÍFICAS...')
    const { data: purchasedData, error: purchasedError } = await supabase
      .from('purchased_books')
      .select('division_id, expires_at')
      .eq('user_id', userId)
      .eq('division_id', divisionId)

    if (purchasedError) {
      console.error('❌ ERRO ao buscar compras:', purchasedError)
    }

    console.log('📚 Dados de compras encontrados:', purchasedData)
    console.log('📚 Total de compras:', purchasedData?.length || 0)

    const validPurchases = (purchasedData || []).filter(pb => new Date(pb.expires_at) > new Date())
    console.log('✅ Compras válidas (não expiradas):', validPurchases.length)
    console.log('✅ Detalhes das compras válidas:', validPurchases)

    const hasPurchasedThisDivision = validPurchases.length > 0
    console.log('🎯 Tem acesso por compra específica?', hasPurchasedThisDivision)

    // 3. Calcular acesso final
    const hasAccess = hasActiveSubscription || hasPurchasedThisDivision

    console.log('🎯 RESULTADO FINAL:')
    console.log('- Tem assinatura ativa?', hasActiveSubscription)
    console.log('- Comprou esta divisão?', hasPurchasedThisDivision)
    console.log('- TEM ACESSO?', hasAccess)

    return NextResponse.json({
      success: true,
      access: {
        hasActiveSubscription,
        hasPurchasedThisDivision,
        hasAccess,
      },
      details: {
        subscription: subscriptionData,
        purchasedBooks: purchasedData,
        validPurchases,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno na verificação de acesso',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
