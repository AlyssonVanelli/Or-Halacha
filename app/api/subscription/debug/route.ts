import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
// import { subscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/client'

const DebugRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  subscriptionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, subscriptionId: initialSubscriptionId } = DebugRequestSchema.parse(body)
    let subscriptionId = initialSubscriptionId

    console.log('=== DEBUG DE ASSINATURA ===')
    console.log('User ID:', userId)
    console.log('Subscription ID:', subscriptionId)

    if (!userId && !subscriptionId) {
      return NextResponse.json({ error: 'userId ou subscriptionId é obrigatório' }, { status: 400 })
    }

    const supabase = createClient()
    let dbSubscription: any = null
    let stripeSubscription: any = null

    // Buscar no banco
    if (userId) {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar assinatura no banco:', error)
      } else {
        dbSubscription = subscription
        if (subscription?.subscription_id) {
          subscriptionId = subscription.subscription_id
        }
      }
    }

    // Buscar no Stripe
    if (subscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      } catch (error) {
        console.error('Erro ao buscar assinatura no Stripe:', error)
      }
    }

    // Comparar dados
    const comparison: {
      database: any
      stripe: any
      differences: Array<{ field: string; database: any; stripe: any }>
    } = {
      database: dbSubscription
        ? {
            id: dbSubscription.id,
            user_id: dbSubscription.user_id,
            status: dbSubscription.status,
            plan_type: dbSubscription.plan_type,
            price_id: dbSubscription.price_id,
            subscription_id: dbSubscription.subscription_id,
            current_period_start: dbSubscription.current_period_start,
            current_period_end: dbSubscription.current_period_end,
            cancel_at_period_end: dbSubscription.cancel_at_period_end,
            explicacao_pratica: dbSubscription.explicacao_pratica,
            created_at: dbSubscription.created_at,
            updated_at: dbSubscription.updated_at,
          }
        : null,
      stripe: stripeSubscription
        ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            customer: stripeSubscription.customer,
            current_period_start: stripeSubscription.current_period_start,
            current_period_end: stripeSubscription.current_period_end,
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            canceled_at: stripeSubscription.canceled_at,
            created: stripeSubscription.created,
            price_id: stripeSubscription.items.data[0]?.price?.id,
            is_plus:
              stripeSubscription.items.data[0]?.price?.id?.includes('plus') ||
              stripeSubscription.items.data[0]?.price?.id?.includes('Plus') ||
              stripeSubscription.items.data[0]?.price?.id === 'price_1RQCodFLuMsSi0YiE0JiHq40',
          }
        : null,
      differences: [],
    }

    // Identificar diferenças
    if (dbSubscription && stripeSubscription) {
      if (dbSubscription.status !== stripeSubscription.status) {
        comparison.differences.push({
          field: 'status',
          database: dbSubscription.status,
          stripe: stripeSubscription.status,
        })
      }

      const dbStart = dbSubscription.current_period_start
        ? new Date(dbSubscription.current_period_start).getTime() / 1000
        : null
      const stripeStart = stripeSubscription.current_period_start

      if (dbStart !== stripeStart) {
        comparison.differences.push({
          field: 'current_period_start',
          database: dbSubscription.current_period_start,
          stripe: stripeSubscription.current_period_start
            ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
            : null,
        })
      }

      const dbEnd = dbSubscription.current_period_end
        ? new Date(dbSubscription.current_period_end).getTime() / 1000
        : null
      const stripeEnd = stripeSubscription.current_period_end

      if (dbEnd !== stripeEnd) {
        comparison.differences.push({
          field: 'current_period_end',
          database: dbSubscription.current_period_end,
          stripe: stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
            : null,
        })
      }

      if (dbSubscription.cancel_at_period_end !== stripeSubscription.cancel_at_period_end) {
        comparison.differences.push({
          field: 'cancel_at_period_end',
          database: dbSubscription.cancel_at_period_end,
          stripe: stripeSubscription.cancel_at_period_end,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: comparison,
    })
  } catch (error) {
    console.error('Erro no debug de assinatura:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos.',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
