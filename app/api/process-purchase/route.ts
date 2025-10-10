import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  try {
    const { userId, bookId, divisionId } = await req.json()

    if (!userId || !bookId || !divisionId) {
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios: userId, bookId, divisionId',
        },
        { status: 400 }
      )
    }

    console.log('🔄 Processando compra manualmente:', {
      userId,
      bookId,
      divisionId,
    })

    const supabase = createClient()

    // Calcula a data de expiração (1 mês a partir de agora)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    console.log('⏰ Data de expiração calculada:', expiresAt.toISOString())

    // Dados para inserção (seguindo a estrutura da tabela purchased_books)
    const purchaseData = {
      user_id: userId,
      book_id: bookId,
      division_id: divisionId,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log('💾 Dados para inserção no banco:', purchaseData)

    // Registra a compra na tabela purchased_books
    console.log('🗄️ Inserindo compra na tabela purchased_books...')
    const { error: purchaseError } = await supabase.from('purchased_books').upsert(purchaseData, {
      onConflict: 'user_id,division_id',
    })

    if (purchaseError) {
      console.error('❌ Erro ao inserir compra no banco:', purchaseError)
      return NextResponse.json(
        {
          error: 'Erro ao registrar compra',
          details: purchaseError.message,
        },
        { status: 500 }
      )
    }

    console.log('✅ Compra registrada com sucesso no banco!')

    return NextResponse.json({
      success: true,
      message: 'Compra processada com sucesso',
      data: {
        userId,
        bookId,
        divisionId,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('❌ Erro no processamento da compra:', error)
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
