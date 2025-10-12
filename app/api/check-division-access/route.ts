import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { userId, divisionId } = await request.json()

    if (!userId || !divisionId) {
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
    const { data: purchasedData, error: purchasedError } = await supabase
      .from('purchased_books')
      .select('division_id, expires_at')
      .eq('user_id', userId)
      .eq('division_id', divisionId)

    if (purchasedError) {
    }

    const validPurchases = (purchasedData || []).filter(pb => new Date(pb.expires_at) > new Date())

    const hasPurchasedThisDivision = validPurchases.length > 0

    // 3. Calcular acesso final
    const hasAccess = hasActiveSubscription || hasPurchasedThisDivision

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
