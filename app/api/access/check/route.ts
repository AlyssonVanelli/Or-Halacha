import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { accessService } from '@/lib/services/access-service'

const AccessCheckSchema = z.object({
  userId: z.string().uuid(),
  resourceType: z.enum(['book', 'division']),
  resourceId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, resourceType, resourceId } = AccessCheckSchema.parse(body)

    console.log('=== VERIFICANDO ACESSO ===')
    console.log('User ID:', userId)
    console.log('Resource Type:', resourceType)
    console.log('Resource ID:', resourceId)

    let hasAccess = false

    if (resourceType === 'book') {
      hasAccess = await accessService.canAccessBook(userId, resourceId)
    } else if (resourceType === 'division') {
      hasAccess = await accessService.canAccessDivision(userId, resourceId)
    }

    return NextResponse.json({
      success: true,
      data: {
        hasAccess,
        resourceType,
        resourceId,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar acesso:', error)

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
