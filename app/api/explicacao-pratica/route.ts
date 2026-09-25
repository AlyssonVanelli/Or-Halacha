import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canReadDivision, getUserAccess, resolveDivisionId } from '@/lib/content/server'

export async function POST(req: Request) {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { simanId, seif } = await req.json()
    if (!simanId || seif === undefined) {
      return NextResponse.json({ error: 'Siman e seif são obrigatórios.' }, { status: 400 })
    }

    const access = await getUserAccess(user.id)
    if (!access.isPlus) {
      return NextResponse.json(
        {
          error: 'A explicação prática está disponível apenas para assinantes do plano Plus.',
          upgradeUrl: '/planos',
        },
        { status: 403 }
      )
    }

    const admin = createAdminClient()
    const { data: chapter } = await admin
      .from('chapters')
      .select('division_id, appendix_type')
      .eq('id', simanId)
      .maybeSingle()
    const divisionId = chapter
      ? await resolveDivisionId(
          chapter.division_id as string | null,
          chapter.appendix_type as string | null
        )
      : null
    if (!chapter || !canReadDivision(access, divisionId)) {
      return NextResponse.json({ error: 'Sem acesso a este siman.' }, { status: 403 })
    }

    const { data } = await admin
      .from('sections')
      .select('practical_explanation')
      .eq('chapter_id', simanId)
      .eq('number', Number(seif))
      .maybeSingle()

    return NextResponse.json({ practical_explanation: data?.practical_explanation || '' })
  } catch (error) {
    console.error('Erro ao buscar explicação prática:', error)
    return NextResponse.json({ error: 'Erro ao buscar explicação prática.' }, { status: 500 })
  }
}
