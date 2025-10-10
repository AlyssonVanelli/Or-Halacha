import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    // Verificar se é uma requisição autorizada (pode adicionar autenticação admin aqui)
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.ADMIN_SECRET_TOKEN

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = await createClient()

    // Executar a função SQL para sortear o siman do dia
    const { data, error } = await supabase.rpc('sortear_siman_do_dia')

    if (error) {
      console.error('Erro ao executar sortear_siman_do_dia:', error)
      return NextResponse.json({ error: 'Erro ao sortear siman do dia' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Siman do dia sorteado com sucesso',
      data,
    })
  } catch (error) {
    console.error('Erro na API de sortear siman:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Endpoint para verificar se já existe siman para hoje
export async function GET() {
  try {
    const supabase = await createClient()
    const hoje = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('siman_do_dia')
      .select('*')
      .eq('data', hoje)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return NextResponse.json({ error: 'Erro ao verificar siman do dia' }, { status: 500 })
    }

    return NextResponse.json({
      exists: !!data,
      siman: data || null,
      date: hoje,
    })
  } catch (error) {
    console.error('Erro ao verificar siman do dia:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
