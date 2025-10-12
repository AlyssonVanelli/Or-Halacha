import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  console.log('=== TESTE DE CONEXÃO COM BANCO ===')

  const supabase = createClient()

  try {
    // Testar conexão simples
    const { data, error } = await supabase.from('subscriptions').select('*').limit(1)

    if (error) {
      console.error('ERRO na conexão:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      console.log('CONEXÃO OK! Dados encontrados:', data?.length || 0, 'assinaturas')
      return NextResponse.json({ success: true, count: data?.length || 0 })
    }
  } catch (err) {
    console.error('ERRO GERAL:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
