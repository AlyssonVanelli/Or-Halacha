import { NextResponse } from 'next/server'
// import { stripe } from '@/lib/stripe'
import { subscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    console.log('=== SINCRONIZANDO TODAS AS ASSINATURAS ===')

    const supabase = createClient()

    // Buscar todas as assinaturas do banco
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .not('subscription_id', 'is', null)

    if (error) {
      console.error('Erro ao buscar assinaturas:', error)
      return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma assinatura encontrada para sincronizar',
        results: [],
      })
    }

    console.log(`Encontradas ${subscriptions.length} assinaturas para sincronizar`)

    const results: Array<{
      subscription_id: string
      stripe_subscription_id: string
      status: string
      data?: any
      error?: string
    }> = []

    for (const subscription of subscriptions) {
      try {
        console.log(
          `\nSincronizando assinatura ${subscription.id} (${subscription.subscription_id})`
        )

        const result = await subscriptionService.syncWithStripe(subscription.subscription_id)

        if (result) {
          console.log(`✅ Assinatura ${subscription.id} sincronizada com sucesso`)
          results.push({
            subscription_id: subscription.id,
            stripe_subscription_id: subscription.subscription_id,
            status: 'success',
            data: {
              status: result.status,
              current_period_start: result.current_period_start,
              current_period_end: result.current_period_end,
              cancel_at_period_end: result.cancel_at_period_end,
              explicacao_pratica: result.explicacao_pratica,
            },
          })
        } else {
          console.error(`❌ Falha ao sincronizar assinatura ${subscription.id}`)
          results.push({
            subscription_id: subscription.id,
            stripe_subscription_id: subscription.subscription_id,
            status: 'failed',
            error: 'Falha na sincronização',
          })
        }
      } catch (error) {
        console.error(`❌ Erro ao sincronizar assinatura ${subscription.id}:`, error)
        results.push({
          subscription_id: subscription.id,
          stripe_subscription_id: subscription.subscription_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const failedCount = results.filter(r => r.status === 'failed' || r.status === 'error').length

    console.log(`\n=== RESULTADO DA SINCRONIZAÇÃO ===`)
    console.log(`✅ Sucessos: ${successCount}`)
    console.log(`❌ Falhas: ${failedCount}`)

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${successCount} sucessos, ${failedCount} falhas`,
      summary: {
        total: subscriptions.length,
        success: successCount,
        failed: failedCount,
      },
      results,
    })
  } catch (error) {
    console.error('Erro geral na sincronização:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
