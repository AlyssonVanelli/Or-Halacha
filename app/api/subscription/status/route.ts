import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { accessService } from '@/lib/services/access-service'

const StatusRequestSchema = z.object({
  userId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = StatusRequestSchema.parse(body)

    console.log('=== VERIFICANDO STATUS DA ASSINATURA ===')
    console.log('User ID:', userId)

    const accessInfo = await accessService.getUserAccess(userId)

    return NextResponse.json({
      success: true,
      data: {
        hasAccess: accessInfo.hasAccess,
        accessType: accessInfo.accessType,
        subscriptionInfo: accessInfo.subscriptionInfo,
        purchaseInfo: accessInfo.purchaseInfo,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)

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
