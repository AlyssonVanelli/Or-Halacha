import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  console.log('=== CANCELANDO ASSINATURA ===')

  const body = await req.json()
  const { userId } = body

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId é obrigatório',
      },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    // Buscar assinatura existente
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('ERRO ao buscar assinatura:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinatura',
          details: fetchError,
        },
        { status: 500 }
      )
    }

    if (!existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assinatura não encontrada',
        },
        { status: 404 }
      )
    }

    console.log('Assinatura encontrada:', existingSubscription)

    // Atualizar status para canceled
    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()

    if (updateError) {
      console.error('ERRO ao cancelar assinatura:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao cancelar assinatura',
          details: updateError,
        },
        { status: 500 }
      )
    }

    console.log('Assinatura cancelada com sucesso:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      subscription: updateResult[0],
    })
  } catch (error) {
    console.error('ERRO geral no cancelamento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral no cancelamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
