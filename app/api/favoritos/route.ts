import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSeifPreviews, getUserAccess } from '@/lib/content/server'
import { simanNumber } from '@/lib/content/format'

// Favoritos do usuário com o texto do seif (respeitando o acesso atual).
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('id, chapter_id, seif_number, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error

    const favs = favorites || []
    const chapterIds = Array.from(new Set(favs.map(f => f.chapter_id as string)))

    const admin = createAdminClient()
    const [access, { data: chapters }] = await Promise.all([
      getUserAccess(user.id),
      chapterIds.length
        ? admin
            .from('chapters')
            .select('id, title, position, division_id, appendix_type, divisions(title)')
            .in('id', chapterIds)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ])

    const previews = await getSeifPreviews(
      favs.map(f => ({ chapterId: f.chapter_id as string, seif: f.seif_number as number })),
      access
    )
    const chapterById = new Map<string, Record<string, unknown>>(
      ((chapters || []) as Array<Record<string, unknown>>).map(c => [c['id'] as string, c])
    )

    return NextResponse.json({
      favorites: favs.map(f => {
        const ch = chapterById.get(f.chapter_id as string) as Record<string, unknown> | undefined
        const division = ch?.['divisions'] as { title?: string } | Array<{ title?: string }> | null
        const preview = previews.get(`${f.chapter_id}:${f.seif_number}`)
        return {
          id: f.id,
          simanId: f.chapter_id,
          seif: f.seif_number,
          simanNumber: ch ? simanNumber(ch['title'] as string, ch['position'] as number) : null,
          divisionId: (ch?.['division_id'] as string) ?? null,
          divisionTitle:
            (Array.isArray(division) ? division[0]?.title : division?.title) ??
            (ch?.['appendix_type'] as string) ??
            null,
          text: preview?.text ?? '',
          canRead: preview?.canRead ?? false,
        }
      }),
    })
  } catch (error) {
    console.error('Erro ao carregar favoritos:', error)
    return NextResponse.json({ error: 'Erro ao carregar favoritos' }, { status: 500 })
  }
}
