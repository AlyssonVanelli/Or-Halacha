import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { subscriptionService } from '@/lib/services/subscription-service'

const CancelRequestSchema = z.object({
  userId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = CancelRequestSchema.parse(body)

    console.log('=== CANCELANDO ASSINATURA ===')
    console.log('User ID:', userId)

    const success = await subscriptionService.cancelSubscription(userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada com sucesso. Você terá acesso até o final do período atual.',
      })
    } else {
      return NextResponse.json(
        { error: 'Não foi possível cancelar a assinatura. Tente novamente.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)

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
