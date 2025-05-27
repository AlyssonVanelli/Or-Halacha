'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Chapter } from '@/app/types'
import { DashboardHeader } from '@/components/DashboardHeader'
import { BookAccessGuard } from '@/components/BookAccessGuard'

interface Appendix {
  appendix_type: string
  simanim: Chapter[]
}

export default function DivisaoPage() {
  const params = useParams()
  const livroId = (params && params['livroId']) as string | undefined
  const tratadoId = (params && params['divisaoId']) as string | undefined
  const [tratado, setTratado] = useState<{ id: string; title: string; chapters: Chapter[] } | null>(
    null
  )
  const [appendices, setAppendices] = useState<Appendix[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tratadoId || !livroId) return
    async function loadTratado() {
      try {
        const supabase = createClient()
        // Buscar capítulos normais
        const { data } = await supabase
          .from('divisions')
          .select(
            `
            id,
            title,
            chapters (
              id,
              title,
              slug,
              position,
              appendix_type
            )
          `
          )
          .eq('id', tratadoId)
          .single()
        if (data) setTratado(data)
        // Buscar apêndices (appendix_type não nulo e division_id null OU igual ao tratadoId)
        const { data: apxChapters } = await supabase
          .from('chapters')
          .select('id, title, slug, position, appendix_type, division_id')
          .eq('book_id', livroId)
          .not('appendix_type', 'is', null)
        // Filtrar apêndices que pertencem a este tratado (division_id igual ao tratadoId OU null)
        const apx: Record<string, Chapter[]> = {}
        apxChapters?.forEach((ch: any) => {
          if (ch.appendix_type && (!ch.division_id || ch.division_id === tratadoId)) {
            const key = ch.appendix_type as string
            if (!apx[key]) apx[key] = []
            apx[key].push(ch)
          }
        })
        setAppendices(
          Object.entries(apx).map(([appendix_type, simanim]) => ({ appendix_type, simanim }))
        )
      } finally {
        setLoading(false)
      }
    }
    loadTratado()
  }, [tratadoId, livroId])

  if (!livroId || !tratadoId) return <div>Parâmetros inválidos</div>

  function getSimanNumber(title: string) {
    const match = title.match(/Siman (\d+)/)
    return match && match[1] ? parseInt(match[1], 10).toString() : ''
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!tratado) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Tratado não encontrado</h2>
          <p className="mt-2 text-muted-foreground">
            O tratado que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    )
  }

  // Simanim principais (sem appendix_type)
  const simanimPrincipais = tratado.chapters.filter(ch => !ch.appendix_type)
  // Apêndices disponíveis
  const appendicesDisponiveis = appendices.map(apx => apx.appendix_type)

  return (
    <BookAccessGuard bookId={livroId}>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
            <div className="mb-6">
              <Link
                href={`/livros/${livroId}`}
                className="inline-block rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
              >
                ← Voltar para o Livro
              </Link>
            </div>
            <h1 className="mb-6 text-center text-3xl font-bold">{tratado.title}</h1>
            <h2 className="mb-4 text-center text-lg font-semibold">Simanim</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {simanimPrincipais
                ?.sort((a, b) => a.position - b.position)
                .map(siman => (
                  <Link
                    key={siman.id}
                    href={`/livros/${livroId}/divisoes/${tratadoId}/siman/${siman.id}`}
                    className="block cursor-pointer rounded-lg border bg-white p-6 text-center shadow-sm transition hover:bg-blue-50 hover:shadow-md"
                  >
                    <span className="text-lg font-semibold">
                      Siman {getSimanNumber(siman.title)}
                    </span>
                  </Link>
                ))}
            </div>
            {/* Botões de Apêndices */}
            {appendicesDisponiveis.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-center text-lg font-bold">Apêndices</h2>
                <div className="flex flex-wrap justify-center gap-6">
                  {appendicesDisponiveis.map(apx => (
                    <Link
                      key={apx}
                      href={`/livros/${livroId}/divisoes/${tratadoId}/apendice/${encodeURIComponent(apx)}`}
                      className="rounded-lg border bg-white px-8 py-4 text-center text-lg font-semibold shadow-sm transition hover:bg-blue-50 hover:shadow-md"
                    >
                      {apx}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </BookAccessGuard>
  )
}
