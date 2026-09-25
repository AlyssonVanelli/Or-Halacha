import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateWithSecurity } from '@/lib/validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { canReadDivision, getUserAccess, resolveDivisionId } from '@/lib/content/server'
import { findFolded, simanNumber, stripSeifNumber } from '@/lib/content/format'

// Schema de validação para a busca
const searchSchemaLocal = z.object({
  query: z.string().min(2).max(100),
  tratado: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(10),
  page: z.number().min(1).optional().default(1),
})

interface SearchRow {
  number: number
  content: string
  chapter_id: string
  chapter_title: string
  chapter_position: number
  division_id: string | null
  appendix_type: string | null
  division_title: string | null
}

type AdminClient = ReturnType<typeof createAdminClient>

// Busca sem acento pela função search_sections (migration 20260927000000_busca_sem_acento)
async function searchUnaccented(
  admin: AdminClient,
  query: string,
  divisionId: string | null,
  limit: number,
  offset: number
) {
  const { data, error } = await admin.rpc('search_sections', {
    p_query: query,
    p_division_id: divisionId,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) return null
  const rows = (data || []) as Array<SearchRow & { total_count: number }>
  return { rows: rows as SearchRow[], total: Number(rows[0]?.total_count ?? 0) }
}

// Busca simples (sensível a acento), usada enquanto a migration não foi aplicada
async function searchPlain(
  admin: AdminClient,
  query: string,
  divisionId: string | null,
  limit: number,
  offset: number
) {
  const escaped = query.replace(/[%_\\]/g, m => `\\${m}`)
  let filter = admin
    .from('sections')
    .select(
      'number, content, chapter_id, chapters!inner(title, position, division_id, appendix_type, divisions(title))',
      { count: 'exact' }
    )
    .ilike('content', `%${escaped}%`)
  if (divisionId) filter = filter.eq('chapters.division_id', divisionId)

  const { data, count, error } = await filter
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1)
  if (error) throw error

  const rows: SearchRow[] = (data || []).map(s => {
    const raw = s.chapters as unknown
    const ch = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>
    const div = ch?.['divisions'] as { title?: string } | Array<{ title?: string }> | null
    return {
      number: s.number as number,
      content: s.content as string,
      chapter_id: s.chapter_id as string,
      chapter_title: ch?.['title'] as string,
      chapter_position: ch?.['position'] as number,
      division_id: (ch?.['division_id'] as string) ?? null,
      appendix_type: (ch?.['appendix_type'] as string) ?? null,
      division_title: (Array.isArray(div) ? div[0]?.title : div?.title) ?? null,
    }
  })
  return { rows, total: count ?? rows.length }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    // Verifica autenticação (cookie de sessão ou Bearer token), validando o JWT no Supabase
    const authHeader = req.headers.get('authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const {
      data: { user },
    } = accessToken ? await supabase.auth.getUser(accessToken) : await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Autenticação necessária para realizar buscas' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Validação com monitoramento de segurança
    const validation = validateWithSecurity(searchSchemaLocal, body, ip, userAgent)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { query, tratado, limit, page } = validation.data
    const pageNumber = page || 1
    const limitNumber = limit || 10
    const offset = (pageNumber - 1) * limitNumber

    // O texto dos seifim só é legível pelo servidor; o acesso é aplicado abaixo
    const admin = createAdminClient()
    const access = await getUserAccess(user.id)

    let divisionFilter: string | null = null
    if (tratado) {
      const { data: division } = await admin
        .from('divisions')
        .select('id')
        .eq('title', tratado)
        .maybeSingle()
      divisionFilter = (division?.id as string) ?? null
    }

    const found =
      (await searchUnaccented(admin, query, divisionFilter, limitNumber, offset)) ??
      (await searchPlain(admin, query, divisionFilter, limitNumber, offset))

    const results = await Promise.all(
      found.rows.map(async row => {
        const divisionId = await resolveDivisionId(row.division_id, row.appendix_type)
        const text = stripSeifNumber(row.content || '')

        // Trecho ao redor do termo buscado (ignorando acentos)
        const pos = findFolded(text, query)
        const start = Math.max(0, pos - 80)
        const context =
          (start > 0 ? '…' : '') +
          text.slice(start, start + 220) +
          (text.length > start + 220 ? '…' : '')

        const canRead = canReadDivision(access, divisionId)
        return {
          tratado: row.division_title || row.appendix_type || '',
          siman: String(simanNumber(row.chapter_title, row.chapter_position)),
          simanId: row.chapter_id,
          divisaoId: divisionId,
          seif: String(row.number),
          // Texto completo só para quem tem acesso ao tratado
          content: canRead ? text : context,
          canRead,
          relevance: 1,
          context,
        }
      })
    )

    return NextResponse.json({
      results,
      total: found.total,
      query,
      tratado: tratado || 'todos',
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(found.total / limitNumber),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros de busca inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao processar a busca:', error)
    return NextResponse.json({ error: 'Erro ao processar a busca' }, { status: 500 })
  }
}
