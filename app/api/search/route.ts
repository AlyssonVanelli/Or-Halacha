import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Schema de validação para a busca
const searchSchema = z.object({
  query: z.string().min(2).max(100),
  tratado: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(10),
  page: z.number().min(1).optional().default(1),
})

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    // Pega o token do header
    const authHeader = req.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    if (accessToken) {
      // @ts-ignore
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' })
    }
    // Verifica autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Autenticação necessária para realizar buscas' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { query, tratado, limit, page } = searchSchema.parse(body)

    // Monta filtro de tratado se necessário
    let filter = supabase
      .from('sections')
      .select(
        `
        id, number, content, chapter_id,
        chapters (
          id, title, division_id,
          divisions (
            id, title
          )
        )
      `,
        { count: 'exact' }
      )
      .ilike('content', `%${query}%`)

    if (tratado) {
      filter = filter.eq('chapters.divisions.title', tratado)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await filter.range(from, to).order('id', { ascending: true })
    if (error) throw error

    // Monta resposta no formato esperado
    const results = (data || []).map((section: any) => ({
      tratado: section.chapters.divisions.title,
      siman: section.chapters.title,
      simanId: section.chapter_id,
      seif: section.number,
      content: section.content,
      relevance: 1, // pode ajustar se quiser
      context: section.content.slice(0, 200),
    }))

    return NextResponse.json({
      results,
      total: count || results.length,
      query,
      tratado: tratado || 'todos',
      page,
      limit,
      totalPages: Math.ceil((count || results.length) / limit),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros de busca inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao processar a busca', details: String(error) },
      { status: 500 }
    )
  }
}
