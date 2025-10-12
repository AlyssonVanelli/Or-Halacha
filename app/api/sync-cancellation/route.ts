import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const supabase = createClient()

    console.log('=== SINCRONIZANDO CANCELAMENTOS ===')

    // 1. Buscar todas as assinaturas no Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
    })

    console.log('Assinaturas no Stripe:', subscriptions.data.length)

    // 2. Buscar todas as assinaturas no banco
    const { data: dbSubscriptions } = await supabase.from('subscriptions').select('*')

    console.log('Assinaturas no banco:', dbSubscriptions?.length || 0)

    const results: Array<{
      subscription: string
      action?: string
      data?: any
      error?: string
    }> = []

    // 3. Para cada assinatura no banco, verificar se ainda existe no Stripe
    for (const dbSub of dbSubscriptions || []) {
      try {
        console.log(`\n=== VERIFICANDO ${dbSub.subscription_id} ===`)

        // Buscar no Stripe
        const stripeSub = subscriptions.data.find(s => s.id === dbSub.subscription_id)

        if (!stripeSub) {
          console.log('❌ Assinatura não encontrada no Stripe - CANCELANDO')

          // Cancelar no banco
          const { data: result, error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              explicacao_pratica: false,
              updated_at: new Date().toISOString(),
            })
            .eq('subscription_id', dbSub.subscription_id)
            .select()

          if (updateError) {
            console.error('❌ Erro ao cancelar:', updateError)
            results.push({ subscription: dbSub.subscription_id, error: updateError.message })
          } else {
            console.log('✅ Assinatura cancelada no banco:', result)
            results.push({ subscription: dbSub.subscription_id, action: 'canceled', data: result })
          }
        } else {
          console.log('✅ Assinatura existe no Stripe - Status:', stripeSub.status)

          // Verificar se o status mudou
          if (dbSub.status !== stripeSub.status) {
            console.log(`🔄 Status mudou: ${dbSub.status} -> ${stripeSub.status}`)

            const { data: result, error: updateError } = await supabase
              .from('subscriptions')
              .update({
                status: stripeSub.status,
                explicacao_pratica:
                  stripeSub.status === 'canceled' ? false : dbSub.explicacao_pratica,
                updated_at: new Date().toISOString(),
              })
              .eq('subscription_id', dbSub.subscription_id)
              .select()

            if (updateError) {
              console.error('❌ Erro ao atualizar:', updateError)
              results.push({ subscription: dbSub.subscription_id, error: updateError.message })
            } else {
              console.log('✅ Status atualizado:', result)
              results.push({ subscription: dbSub.subscription_id, action: 'updated', data: result })
            }
          } else {
            console.log('✅ Status já está correto')
            results.push({ subscription: dbSub.subscription_id, action: 'no_change' })
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${dbSub.subscription_id}:`, error)
        results.push({ subscription: dbSub.subscription_id, error: error.message })
      }
    }

    console.log('\n=== SINCRONIZAÇÃO DE CANCELAMENTOS COMPLETA ===')
    console.log('Resultados:', results)

    return NextResponse.json({
      success: true,
      message: 'Sincronização de cancelamentos concluída',
      results,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
