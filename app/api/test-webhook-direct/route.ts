import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    console.log('🧪 TESTE DIRETO DO WEBHOOK')

    const { userId, divisionId, bookId, paymentIntentId } = await req.json()

    console.log('Parâmetros:', { userId, divisionId, bookId, paymentIntentId })

    const supabase = await createClient()

    // Simular o processamento do webhook
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    console.log('Data de expiração:', expiresAt.toISOString())

    const purchaseData = {
      user_id: userId,
      book_id: bookId,
      division_id: divisionId,
      expires_at: expiresAt.toISOString(),
      stripe_payment_intent_id: paymentIntentId || 'test_payment_intent_' + Date.now(),
      created_at: new Date().toISOString(),
    }

    console.log('Dados para inserção:', purchaseData)

    // Inserir diretamente no banco
    const { data: result, error } = await supabase.from('purchased_books').upsert(purchaseData, {
      onConflict: 'user_id,division_id',
    })

    if (error) {
      console.error('❌ Erro na inserção:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('✅ Inserção bem-sucedida:', result)

    // Verificar se foi inserido
    const { data: verifyAccess, error: verifyError } = await supabase
      .from('purchased_books')
      .select('*')
      .eq('user_id', userId)
      .eq('division_id', divisionId)

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError)
    } else {
      console.log('✅ Acesso verificado:', verifyAccess)
    }

    return NextResponse.json({
      success: true,
      message: 'Teste direto do webhook realizado',
      data: result,
      verification: verifyAccess,
    })
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
