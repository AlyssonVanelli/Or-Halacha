import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

export async function POST() {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: purchasedData } = await supabase
      .from('purchased_books')
      .select('division_id, expires_at')
      .eq('user_id', user.id)

    const now = new Date()
    const hasActiveSubscription =
      subscriptionData?.status === 'active' &&
      (!subscriptionData.current_period_end || new Date(subscriptionData.current_period_end) > now)

    const validPurchasedBooks = (purchasedData || []).filter(pb => new Date(pb.expires_at) > now)
    const hasPurchasedBooks = validPurchasedBooks.length > 0

    return NextResponse.json({
      success: true,
      supabase: {
        subscription: subscriptionData,
        purchasedBooks: purchasedData,
      },
      access: {
        hasActiveSubscription,
        hasPurchasedBooks,
        hasAnyAccess: hasActiveSubscription || hasPurchasedBooks,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar acesso do usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
