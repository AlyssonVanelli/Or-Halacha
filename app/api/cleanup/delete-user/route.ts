import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    console.log('=== DELETANDO USER DO BANCO ===')

    const supabase = createClient()
    const userId = '4a5d37b9-fa2b-45f7-96c2-12a9fd766d3c'

    // 1. Deletar assinaturas
    console.log('Deletando assinaturas...')
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    if (subscriptionsError) {
      console.error('Erro ao deletar assinaturas:', subscriptionsError)
    } else {
      console.log('✅ Assinaturas deletadas')
    }

    // 2. Deletar profile
    console.log('Deletando profile...')
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)

    if (profileError) {
      console.error('Erro ao deletar profile:', profileError)
    } else {
      console.log('✅ Profile deletado')
    }

    // 3. Deletar user do auth (se possível)
    console.log('Tentando deletar user do auth...')
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        console.log('Não foi possível deletar do auth (normal):', authError.message)
      } else {
        console.log('✅ User deletado do auth')
      }
    } catch (error) {
      console.log('Não foi possível deletar do auth (normal)')
    }

    return NextResponse.json({
      success: true,
      message: 'User deletado do banco',
      userId,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
