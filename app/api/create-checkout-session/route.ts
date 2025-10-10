import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { divisionId, userId } = await req.json()

    if (!divisionId || !userId) {
      return NextResponse.json({ error: 'divisionId e userId são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()

    // Gerar token único para esta sessão
    const sessionToken = randomUUID()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos

    // Armazenar sessão no banco de dados
    const { error: sessionError } = await supabase.from('checkout_sessions').insert({
      id: sessionToken,
      user_id: userId,
      division_id: divisionId,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    })

    if (sessionError) {
      return NextResponse.json({ error: 'Erro ao criar sessão de checkout' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sessionToken,
      checkoutUrl: `/api/direct-checkout?sessionToken=${sessionToken}`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
