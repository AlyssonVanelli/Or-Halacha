import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  const { userId } = await req.json()
  const supabase = await createClient()

  // Verifica assinatura ativa
  const { data: assinatura } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (assinatura) {
    return NextResponse.json({ access: true, reason: 'assinatura' })
  }

  // Verifica se tem pelo menos um tratado comprado e ativo
  const { data: purchased } = await supabase
    .from('purchased_books')
    .select('id, expires_at, division_id, book_id')
    .eq('user_id', userId)

  const ativos = (purchased || []).filter(pb => new Date(pb.expires_at) > new Date())

  if (ativos.length > 0) {
    return NextResponse.json({ access: true, reason: 'livro' })
  }

  return NextResponse.json({ access: false })
}
