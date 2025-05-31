import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { userId, simanId, seif } = await req.json()
    const supabase = createClient()
    // Verifica assinatura ativa e se tem direito à explicação prática
    const { data: assinatura } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    if (!assinatura || !assinatura.explicacao_pratica) {
      return NextResponse.json(
        {
          error:
            'A explicação prática está disponível apenas para assinantes do plano Plus.\n\n<a href="/upgrade" class="font-semibold text-blue-600 underline">Clique aqui para fazer upgrade</a>',
        },
        { status: 403 }
      )
    }
    // Busca explicação prática
    const { data } = await supabase
      .from('sections')
      .select('practical_explanation')
      .eq('chapter_id', simanId)
      .eq('number', seif)
      .single()
    return NextResponse.json({ practical_explanation: data?.practical_explanation || '' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar explicação prática.' }, { status: 500 })
  }
}
