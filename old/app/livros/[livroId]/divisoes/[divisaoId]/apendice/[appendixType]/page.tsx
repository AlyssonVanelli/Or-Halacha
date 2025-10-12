'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Chapter } from '@/app/types'
import { DashboardHeader } from '@/components/DashboardHeader'
import { BookAccessGuard } from '@/components/BookAccessGuard'

export default function AppendixPage() {
  const params = useParams()
  const livroId = (params && params['livroId']) as string | undefined
  const tratadoId = (params && params['divisaoId']) as string | undefined
  const appendixType = (params && params['appendixType']) as string | undefined
  const [simanim, setSimanim] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!livroId || !appendixType) return
    async function loadSimanim() {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('chapters')
        .select('id, title, slug, position')
        .eq('book_id', livroId)
        .eq('appendix_type', decodeURIComponent(appendixType as string))
      if (tratadoId) {
        query = query.or(`division_id.eq.${tratadoId},division_id.is.null`)
      } else {
        query = query.or('division_id.is.null')
      }
      const { data } = await query
      setSimanim(data || [])
      setLoading(false)
    }
    loadSimanim()
  }, [livroId, tratadoId, appendixType])

  function getSimanNumber(title: string) {
    const match = title.match(/Siman (\d+)/)
    return match && match[1] ? parseInt(match[1], 10).toString() : ''
  }

  if (!livroId || !tratadoId || !appendixType) return <div>Parâmetros inválidos</div>

  return (
    <BookAccessGuard bookId={livroId}>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
            <div className="mb-6">
              <Link
                href={`/livros/${livroId}/divisoes/${tratadoId}`}
                className="inline-block rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
              >
                ← Voltar para o Tratado
              </Link>
            </div>
            <h1 className="mb-6 text-center text-3xl font-bold">
              {decodeURIComponent(appendixType)}
            </h1>
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {simanim
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
            )}
          </div>
        </main>
      </div>
    </BookAccessGuard>
  )
}
