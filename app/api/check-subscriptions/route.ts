import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  console.log('=== VERIFICANDO ASSINATURAS NO BANCO ===')

  const supabase = createClient()

  try {
    // Buscar todas as assinaturas
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (subscriptionsError) {
      console.error('ERRO ao buscar assinaturas:', subscriptionsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinaturas',
          details: subscriptionsError,
        },
        { status: 500 }
      )
    }

    console.log('Assinaturas encontradas:', subscriptions?.length || 0)

    // Buscar perfis com stripe_customer_id
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, created_at')
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (profilesError) {
      console.error('ERRO ao buscar perfis:', profilesError)
    } else {
      console.log('Perfis com Stripe Customer ID:', profiles?.length || 0)
    }

    return NextResponse.json({
      success: true,
      message: 'Verificação concluída',
      data: {
        subscriptions: subscriptions || [],
        profilesWithStripeId: profiles || [],
        totalSubscriptions: subscriptions?.length || 0,
        totalProfilesWithStripeId: profiles?.length || 0,
      },
    })
  } catch (error) {
    console.error('ERRO geral na verificação:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral na verificação',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
