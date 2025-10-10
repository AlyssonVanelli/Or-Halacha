import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { userId, divisionId, bookId } = body

    if (!userId || !divisionId || !bookId) {
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios: userId, divisionId, bookId',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar o ID real do livro "Shulchan Aruch"
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('title', 'Shulchan Aruch')
      .single()

    if (bookError || !bookData) {
      return NextResponse.json(
        {
          error: 'Livro Shulchan Aruch não encontrado',
          details: bookError?.message,
        },
        { status: 404 }
      )
    }

    const realBookId = bookData.id

    // Calcula a data de expiração (1 mês a partir de agora)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    // Dados para inserção na purchased_books
    const purchaseData = {
      user_id: userId,
      book_id: realBookId, // Usar o ID real do livro
      division_id: divisionId,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }

    // Inserir na tabela purchased_books
    const { data: insertData, error: purchaseError } = await supabase
      .from('purchased_books')
      .upsert(purchaseData, {
        onConflict: 'user_id,division_id',
      })
      .select()

    if (purchaseError) {
      return NextResponse.json(
        {
          error: 'Erro ao registrar compra do tratado',
          details: purchaseError.message,
          code: purchaseError.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tratado avulso processado com sucesso',
      data: {
        userId,
        bookId,
        divisionId,
        expiresAt: expiresAt.toISOString(),
        insertedData: insertData,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
