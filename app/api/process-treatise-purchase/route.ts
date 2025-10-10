import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    console.log('🔄 API process-treatise-purchase INICIADA')

    const body = await req.json()
    console.log('📥 Body recebido:', body)

    const { userId, divisionId, bookId } = body

    console.log('📊 Dados extraídos:', { userId, divisionId, bookId })

    if (!userId || !divisionId || !bookId) {
      console.error('❌ Parâmetros obrigatórios faltando:', { userId, divisionId, bookId })
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios: userId, divisionId, bookId',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar o ID real do livro "Shulchan Aruch"
    console.log('🔍 Buscando ID do livro Shulchan Aruch...')
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('title', 'Shulchan Aruch')
      .single()

    if (bookError || !bookData) {
      console.error('❌ Erro ao buscar livro Shulchan Aruch:', bookError)
      return NextResponse.json(
        {
          error: 'Livro Shulchan Aruch não encontrado',
          details: bookError?.message,
        },
        { status: 404 }
      )
    }

    const realBookId = bookData.id
    console.log('✅ ID do livro encontrado:', realBookId)

    // Calcula a data de expiração (1 mês a partir de agora)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    console.log('⏰ Data de expiração calculada:', expiresAt.toISOString())

    // Dados para inserção na purchased_books
    const purchaseData = {
      user_id: userId,
      book_id: realBookId, // Usar o ID real do livro
      division_id: divisionId,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log('💾 Dados para inserção na purchased_books:', purchaseData)

    // Inserir na tabela purchased_books
    console.log('🗄️ Iniciando inserção no Supabase...')
    const { data: insertData, error: purchaseError } = await supabase
      .from('purchased_books')
      .upsert(purchaseData, {
        onConflict: 'user_id,division_id',
      })
      .select()

    console.log('💾 RESULTADO DA INSERÇÃO - purchased_books:', {
      success: !purchaseError,
      data: insertData,
      error: purchaseError,
      errorDetails: purchaseError?.message,
      errorCode: purchaseError?.code,
    })

    if (purchaseError) {
      console.error('❌ ERRO AO INSERIR NA purchased_books:', {
        message: purchaseError.message,
        code: purchaseError.code,
        details: purchaseError.details,
        hint: purchaseError.hint,
      })
      return NextResponse.json(
        {
          error: 'Erro ao registrar compra do tratado',
          details: purchaseError.message,
          code: purchaseError.code,
        },
        { status: 500 }
      )
    }

    console.log('✅ SUCESSO: Tratado avulso inserido na purchased_books!')
    console.log('📊 Dados inseridos:', insertData)

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
    console.error('❌ Erro no processamento do tratado avulso:', error)
    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
