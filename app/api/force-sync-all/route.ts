import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const supabase = createClient()

    console.log('=== FORÇANDO SINCRONIZAÇÃO COMPLETA ===')

    // 1. Buscar todas as assinaturas no Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
    })

    console.log('Assinaturas no Stripe:', subscriptions.data.length)

    const results: Array<{
      subscription: string
      success: boolean
      data?: any
      error?: string
    }> = []

    for (const subscription of subscriptions.data) {
      try {
        console.log(`\n=== PROCESSANDO ${subscription.id} ===`)
        console.log('Status:', subscription.status)
        console.log('Customer:', subscription.customer)

        // Buscar profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (!profile) {
          console.log('❌ Profile não encontrado para customer:', subscription.customer)
          continue
        }

        console.log('✅ Profile encontrado:', profile.id)

        // Determinar plan type
        const planType =
          subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

        // Detectar Plus
        let explicacaoPratica = false
        try {
          const sessions = await stripe.checkout.sessions.list({
            subscription: subscription.id,
            limit: 1,
          })

          if (sessions.data.length > 0) {
            const session = sessions.data[0]
            const metadata = session.metadata || {}
            explicacaoPratica =
              metadata.isPlus === 'true' ||
              metadata.planType?.toLowerCase().includes('plus') ||
              false
            console.log('Metadata:', metadata)
          }
        } catch (err) {
          console.log('Erro ao buscar session:', err)
        }

        // Se cancelar, explicacao_pratica deve ser false
        if (subscription.status === 'canceled') {
          explicacaoPratica = false
        }

        // Datas CORRETAS
        const currentPeriodStart = (subscription as any).current_period_start
          ? new Date((subscription as any).current_period_start * 1000).toISOString()
          : null
        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null

        console.log('Current Period Start:', currentPeriodStart)
        console.log('Current Period End:', currentPeriodEnd)
        console.log('Plan Type:', planType)
        console.log('Explicação Prática:', explicacaoPratica)

        // Upsert
        const { data: result, error: upsertError } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: profile.id,
              status: subscription.status,
              plan_type: planType,
              price_id: subscription.items.data[0]?.price?.id || '',
              subscription_id: subscription.id,
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end,
              explicacao_pratica: explicacaoPratica,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()

        if (upsertError) {
          console.error('❌ Erro no upsert:', upsertError)
          results.push({
            subscription: subscription.id,
            success: false,
            error: upsertError.message,
          })
        } else {
          console.log('✅ Assinatura sincronizada:', result)
          results.push({ subscription: subscription.id, success: true, data: result })
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${subscription.id}:`, error)
        results.push({ subscription: subscription.id, success: false, error: error.message })
      }
    }

    console.log('\n=== SINCRONIZAÇÃO COMPLETA ===')
    console.log('Resultados:', results)

    return NextResponse.json({
      success: true,
      message: 'Sincronização forçada concluída',
      results,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
