import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  console.log('=== CORRIGINDO ASSINATURAS ===')

  const supabase = createClient()

  try {
    // Buscar todas as assinaturas no banco
    const { data: dbSubscriptions, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')

    if (dbError) {
      console.error('ERRO ao buscar assinaturas:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinaturas',
          details: dbError,
        },
        { status: 500 }
      )
    }

    console.log('Assinaturas encontradas no banco:', dbSubscriptions?.length || 0)

    for (const dbSub of dbSubscriptions || []) {
      console.log('=== PROCESSANDO ASSINATURA ===')
      console.log('User ID:', dbSub.user_id)
      console.log('Status atual:', dbSub.status)
      console.log('Plan Type:', dbSub.plan_type)
      console.log('Price ID:', dbSub.price_id)
      console.log('Explicação Prática:', dbSub.explicacao_pratica)

      // Verificar se é assinatura Plus baseado no price_id
      const isPlusSubscription =
        dbSub.price_id?.includes('plus') || dbSub.plan_type?.includes('plus')

      console.log('É assinatura Plus?', isPlusSubscription)

      // Se é Plus mas não está marcado como tal, corrigir
      if (isPlusSubscription && !dbSub.explicacao_pratica) {
        console.log('Corrigindo assinatura Plus...')

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            explicacao_pratica: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbSub.id)

        if (updateError) {
          console.error('ERRO ao corrigir assinatura:', updateError)
        } else {
          console.log('Assinatura Plus corrigida com sucesso')
        }
      }

      // Verificar no Stripe se a assinatura ainda está ativa
      if (dbSub.subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(dbSub.subscription_id)
          console.log('Status no Stripe:', stripeSubscription.status)

          // Se está cancelada no Stripe mas ativa no banco, corrigir
          if (stripeSubscription.status === 'canceled' && dbSub.status === 'active') {
            console.log('Corrigindo status cancelado...')

            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                status: 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', dbSub.id)

            if (updateError) {
              console.error('ERRO ao corrigir status:', updateError)
            } else {
              console.log('Status cancelado corrigido com sucesso')
            }
          }

          // Se está ativa no Stripe mas cancelada no banco, corrigir
          if (
            (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') &&
            dbSub.status === 'canceled'
          ) {
            console.log('Corrigindo status ativo...')

            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_start: (stripeSubscription as any).current_period_start
                  ? new Date((stripeSubscription as any).current_period_start * 1000).toISOString()
                  : null,
                current_period_end: (stripeSubscription as any).current_period_end
                  ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
                  : null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', dbSub.id)

            if (updateError) {
              console.error('ERRO ao corrigir status ativo:', updateError)
            } else {
              console.log('Status ativo corrigido com sucesso')
            }
          }
        } catch (stripeError) {
          console.error('ERRO ao verificar no Stripe:', stripeError)
        }
      }
    }

    console.log('=== CORREÇÃO CONCLUÍDA ===')

    return NextResponse.json({
      success: true,
      message: 'Assinaturas corrigidas com sucesso',
      processed: dbSubscriptions?.length || 0,
    })
  } catch (error) {
    console.error('ERRO geral na correção:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno na correção',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
