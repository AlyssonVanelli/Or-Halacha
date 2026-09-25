import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { divisionId } = await request.json()
    if (!divisionId) {
      return NextResponse.json({ error: 'divisionId é obrigatório' }, { status: 400 })
    }

    const now = new Date()

    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    const hasActiveSubscription =
      !!subscriptionData &&
      (!subscriptionData.current_period_end || new Date(subscriptionData.current_period_end) > now)

    const { data: purchasedData } = await supabase
      .from('purchased_books')
      .select('division_id, expires_at')
      .eq('user_id', user.id)
      .eq('division_id', divisionId)

    const validPurchases = (purchasedData || []).filter(pb => new Date(pb.expires_at) > now)
    const hasPurchasedThisDivision = validPurchases.length > 0

    return NextResponse.json({
      success: true,
      access: {
        hasActiveSubscription,
        hasPurchasedThisDivision,
        hasAccess: hasActiveSubscription || hasPurchasedThisDivision,
      },
      details: {
        validPurchases,
      },
    })
  } catch (error) {
    console.error('Erro na verificação de acesso à divisão:', error)
    return NextResponse.json({ error: 'Erro interno na verificação de acesso' }, { status: 500 })
  }
}
