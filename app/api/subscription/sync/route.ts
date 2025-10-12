import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { subscriptionService } from '@/lib/services/subscription-service'

const SyncRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  subscriptionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, subscriptionId } = SyncRequestSchema.parse(body)

    console.log('=== FORÇANDO SINCRONIZAÇÃO DE ASSINATURA ===')
    console.log('User ID:', userId)
    console.log('Subscription ID:', subscriptionId)

    if (!userId && !subscriptionId) {
      return NextResponse.json({ error: 'userId ou subscriptionId é obrigatório' }, { status: 400 })
    }

    let result: any = null

    if (subscriptionId) {
      // Sincronizar por subscription ID
      result = await subscriptionService.syncWithStripe(subscriptionId)
    } else if (userId) {
      // Buscar subscription ID do usuário e sincronizar
      const subscription = await subscriptionService.getSubscriptionByUserId(userId)
      if (subscription?.subscription_id) {
        result = await subscriptionService.syncWithStripe(subscription.subscription_id)
      } else {
        return NextResponse.json(
          { error: 'Assinatura não encontrada para este usuário' },
          { status: 404 }
        )
      }
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Assinatura sincronizada com sucesso',
        data: {
          id: result.id,
          status: result.status,
          plan_type: result.plan_type,
          current_period_start: result.current_period_start,
          current_period_end: result.current_period_end,
          cancel_at_period_end: result.cancel_at_period_end,
          explicacao_pratica: result.explicacao_pratica,
          updated_at: result.updated_at,
        },
      })
    } else {
      return NextResponse.json({ error: 'Falha ao sincronizar assinatura' }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro ao sincronizar assinatura:', error)

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
