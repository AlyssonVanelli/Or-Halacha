import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    console.log('=== TESTE DE INSERÇÃO NO BANCO ===')
    
    const { userId, divisionId, bookId } = await req.json()
    
    console.log('Parâmetros recebidos:', { userId, divisionId, bookId })
    
    const supabase = await createClient()
    console.log('Cliente Supabase criado:', !!supabase)
    
    // Testar inserção na tabela purchased_books
    const testData = {
      user_id: userId,
      book_id: bookId,
      division_id: divisionId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      stripe_payment_intent_id: 'test_payment_intent_' + Date.now(),
      created_at: new Date().toISOString(),
    }
    
    console.log('Dados para teste:', testData)
    
    const { data, error } = await supabase
      .from('purchased_books')
      .upsert(testData, {
        onConflict: 'user_id,division_id',
      })
    
    if (error) {
      console.error('❌ ERRO NO TESTE:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }
    
    console.log('✅ TESTE BEM-SUCEDIDO:', data)
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Teste de inserção realizado com sucesso' 
    })
    
  } catch (error) {
    console.error('❌ ERRO GERAL NO TESTE:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}
