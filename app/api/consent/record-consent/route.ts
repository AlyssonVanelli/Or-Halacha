import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

const CONSENT_TYPES = ['essential', 'analytics', 'marketing', 'terms_of_use', 'privacy'] as const

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    // Aceita os dois formatos usados no frontend (banner de cookies e cadastro)
    const consentType = body.consent_type ?? body.consentType

    if (!CONSENT_TYPES.includes(consentType)) {
      return NextResponse.json({ error: 'consent_type inválido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('data_consents')
      .insert({
        user_id: user.id,
        consent_type: consentType,
        granted_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('Erro ao salvar consentimento:', error.message)
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
