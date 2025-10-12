import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    console.log('=== VERIFICANDO PERFIL DO USUÁRIO ===')

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    console.log('User ID:', userId)

    const supabase = createClient()

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar perfil do usuário',
          details: profileError,
        },
        { status: 500 }
      )
    }

    console.log('Perfil encontrado:', profile)

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado',
          message: 'O usuário não existe na tabela profiles',
        },
        { status: 404 }
      )
    }

    // Verificar se tem stripe_customer_id
    const hasStripeCustomerId = !!profile.stripe_customer_id
    console.log('Tem Stripe Customer ID:', hasStripeCustomerId)
    console.log('Stripe Customer ID:', profile.stripe_customer_id)

    // Buscar assinaturas do usuário
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (subscriptionsError) {
      console.error('Erro ao buscar assinaturas:', subscriptionsError)
    }

    console.log('Assinaturas encontradas:', subscriptions?.length || 0)
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach(sub => {
        console.log(`- ID: ${sub.id}`)
        console.log(`  Status: ${sub.status}`)
        console.log(`  Subscription ID: ${sub.subscription_id}`)
        console.log(`  Current Period Start: ${sub.current_period_start}`)
        console.log(`  Current Period End: ${sub.current_period_end}`)
        console.log(`  Explicação Prática: ${sub.explicacao_pratica}`)
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          stripe_customer_id: profile.stripe_customer_id,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        hasStripeCustomerId,
        subscriptions: subscriptions || [],
        summary: {
          profileExists: !!profile,
          hasStripeCustomerId,
          totalSubscriptions: subscriptions?.length || 0,
          activeSubscriptions: subscriptions?.filter(sub => sub.status === 'active').length || 0,
        },
      },
    })
  } catch (error) {
    console.error('Erro na verificação do perfil:', error)
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
