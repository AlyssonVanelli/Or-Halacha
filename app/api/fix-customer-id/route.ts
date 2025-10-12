import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    const supabase = createClient()

    console.log('=== CORRIGINDO CUSTOMER ID ===')

    // Customer ID correto do Stripe
    const correctCustomerId = 'cus_TDchuNP6TWPMSH'

    // Atualizar o customer ID no banco
    const { data, error } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: correctCustomerId })
      .eq('id', '4a5d37b9-fa2b-45f7-96c2-12a9fd766d3c')
      .select()

    if (error) {
      console.error('Erro ao atualizar customer ID:', error)
      return NextResponse.json({ error: 'Erro ao atualizar customer ID' }, { status: 500 })
    }

    console.log('✅ Customer ID atualizado com sucesso:', data)

    return NextResponse.json({
      success: true,
      message: 'Customer ID atualizado com sucesso',
      data: data,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
