import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const supabase = createClient()

    // Buscar compras do usuário
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchased_books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (purchasesError) {
      return NextResponse.json(
        {
          error: 'Erro ao buscar compras',
          details: purchasesError.message,
        },
        { status: 500 }
      )
    }

    // Buscar assinaturas do usuário
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (subscriptionsError) {
      return NextResponse.json(
        {
          error: 'Erro ao buscar assinaturas',
          details: subscriptionsError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      purchases: purchases || [],
      subscriptions: subscriptions || [],
      summary: {
        totalPurchases: purchases?.length || 0,
        totalSubscriptions: subscriptions?.length || 0,
        activePurchases: purchases?.filter(p => new Date(p.expires_at) > new Date()).length || 0,
        activeSubscriptions: subscriptions?.filter(s => s.status === 'active').length || 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
