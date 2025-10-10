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

    // Cache de 10 minutos para dados de tratado
    const cacheKey = `tratado-${tratadoId}`
    const cachedData = localStorage.getItem(cacheKey)
    const cacheTime = localStorage.getItem(`${cacheKey}-time`)
    const now = Date.now()

    if (cachedData && cacheTime && now - parseInt(cacheTime) < 10 * 60 * 1000) {
      const data = JSON.parse(cachedData)
      setTratado(data.tratado)
      setAppendices(data.appendices || [])
      setLoading(false)
      return
    }

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
        apxChapters?.forEach((ch: Chapter & { appendix_type?: string; division_id?: string }) => {
          if (ch.appendix_type && (!ch.division_id || ch.division_id === tratadoId)) {
            const key = ch.appendix_type as string
            if (!apx[key]) apx[key] = []
            apx[key].push(ch)
          }
        })
        setAppendices(
          Object.entries(apx).map(([appendix_type, simanim]) => ({ appendix_type, simanim }))
        )

        // Salvar no cache
        const cacheData = {
          tratado,
          appendices: Object.entries(apx).map(([appendix_type, simanim]) => ({
            appendix_type,
            simanim,
          })),
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        localStorage.setItem(`${cacheKey}-time`, now.toString())
      } finally {
        setLoading(false)
      }
    }
    loadTratado()
  }, [tratadoId, livroId, tratado])

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
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <DashboardHeader />
        <main className="flex-1">
          <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href={`/livros/${livroId}`}
                className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Voltar para o Shulchan Aruch
              </Link>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-500 p-3">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">{tratado.title}</h1>
                  <p className="mt-2 text-lg text-gray-600">Selecione um siman para estudar</p>
                </div>
              </div>
            </div>

            {/* Grid de Simanim */}
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold text-gray-800">Simanim</h2>
                <p className="text-lg text-gray-600">Escolha um siman para começar</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {simanimPrincipais
                  ?.sort((a, b) => a.position - b.position)
                  .map(siman => {
                    return (
                      <Link
                        key={siman.id}
                        href={`/livros/${livroId}/divisoes/${tratadoId}/siman/${siman.id}`}
                        className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:scale-105 hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                            <svg
                              className="h-6 w-6 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {getSimanNumber(siman.title)}
                            </div>
                            <div className="text-sm text-gray-500">Siman</div>
                          </div>
                        </div>

                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Siman {getSimanNumber(siman.title)}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600">Clique para estudar</p>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </div>

            {/* Apêndices */}
            {appendicesDisponiveis.length > 0 && (
              <div className="mx-auto mt-12 max-w-6xl">
                <div className="mb-8 text-center">
                  <h2 className="mb-4 text-3xl font-bold text-gray-800">Apêndices</h2>
                  <p className="text-lg text-gray-600">Conteúdo adicional disponível</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {appendicesDisponiveis.map(apx => {
                    return (
                      <Link
                        key={apx}
                        href={`/livros/${livroId}/divisoes/${tratadoId}/apendice/${encodeURIComponent(apx)}`}
                        className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:scale-105 hover:border-purple-300 hover:shadow-md"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                            <svg
                              className="h-6 w-6 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-purple-600">Apêndice</div>
                          </div>
                        </div>

                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-800">{apx}</h3>
                          <p className="mt-2 text-sm text-gray-600">Conteúdo adicional</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </BookAccessGuard>
  )
}
