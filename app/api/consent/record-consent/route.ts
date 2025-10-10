import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { user_id, consent_type } = await request.json()

    if (!user_id || !consent_type) {
      return NextResponse.json(
        { error: 'user_id e consent_type são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o user_id corresponde ao usuário autenticado
    if (user.id !== user_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Inserir o consentimento na tabela data_consents
    const { data, error } = await supabase
      .from('data_consents')
      .insert({
        user_id: user_id,
        consent_type: consent_type,
        granted_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar consentimento' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Consentimento registrado com sucesso',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
