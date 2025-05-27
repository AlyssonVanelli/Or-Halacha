import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
if (!supabaseUrl || !supabaseKey)
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { consentType } = body
    if (!consentType) {
      return NextResponse.json({ error: 'Tipo de consentimento é obrigatório' }, { status: 400 })
    }

    // Loga todos os cookies recebidos

    // Procura o cookie de auth do Supabase
    const authCookie = req.cookies
      .getAll()
      .find(cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'))

    let token: string | undefined = undefined
    if (authCookie) {
      try {
        // O valor é um array serializado em JSON, o primeiro item é o JWT
        const arr = JSON.parse(authCookie.value)
        token = Array.isArray(arr) ? arr[0] : undefined
      } catch (e) {}
    } else {
    }
    let user_id: string | null = null
    if (token) {
      const result = await supabaseAdmin.auth.getUser(token)
      const {
        data: { user },
        error: userErr,
      } = result
      if (!userErr && user) {
        user_id = user.id
      } else {
      }
    } else {
    }

    const { error } = await supabaseAdmin
      .from('data_consents')
      .insert({ user_id, consent_type: consentType })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 })
  }
}
