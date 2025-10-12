import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    console.log('=== SIMULANDO WEBHOOK DE COMPRA DE TRATADO ===')
    
    const { userId, divisionId, bookId, paymentIntentId } = await req.json()
    
    console.log('Parâmetros recebidos:', { userId, divisionId, bookId, paymentIntentId })
    
    const supabase = await createClient()
    console.log('Cliente Supabase criado:', !!supabase)
    
    // Simular o processamento do webhook
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)
    
    console.log('Data de expiração:', expiresAt.toISOString())
    
    const testData = {
      user_id: userId,
      book_id: bookId,
      division_id: divisionId,
      expires_at: expiresAt.toISOString(),
      stripe_payment_intent_id: paymentIntentId || 'test_payment_intent_' + Date.now(),
      created_at: new Date().toISOString(),
    }
    
    console.log('Dados para inserção:', testData)
    
    // Testar conexão primeiro
    console.log('🧪 TESTANDO CONEXÃO COM BANCO...')
    const { data: testData2, error: testError } = await supabase
      .from('purchased_books')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ ERRO NA CONEXÃO:', testError)
      return NextResponse.json({ success: false, error: testError.message }, { status: 500 })
    }
    
    console.log('✅ CONEXÃO OK:', testData2)
    
    // Inserir dados
    console.log('Executando upsert...')
    const { data: result, error } = await supabase
      .from('purchased_books')
      .upsert(testData, {
        onConflict: 'user_id,division_id',
      })
    
    if (error) {
      console.error('❌ ERRO NO UPSERT:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }
    
    console.log('✅ UPSERT BEM-SUCEDIDO:', result)
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Simulação de webhook realizada com sucesso' 
    })
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}
