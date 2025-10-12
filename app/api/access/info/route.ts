import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { accessService } from '@/lib/services/access-service'

const AccessInfoSchema = z.object({
  userId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = AccessInfoSchema.parse(body)

    console.log('=== OBTENDO INFORMAÇÕES DE ACESSO ===')
    console.log('User ID:', userId)

    const detailedInfo = await accessService.getDetailedAccessInfo(userId)

    return NextResponse.json({
      success: true,
      data: detailedInfo,
    })
  } catch (error) {
    console.error('Erro ao obter informações de acesso:', error)

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
