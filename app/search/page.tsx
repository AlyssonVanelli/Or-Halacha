'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { SeifModal } from '@/components/SeifModal'
import { useAuth } from '@/contexts/auth-context'
import { SearchResults } from '@/components/SearchResults'

interface SearchResult {
  tratado: string
  siman: string
  seif: string
  content: string
  relevance: number
  context: string
  simanId: string
}

const PAGE_SIZE = 10

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()!
  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [explicacaoPratica, setExplicacaoPratica] = useState<string | undefined>(undefined)
  const [loadingExplicacao, setLoadingExplicacao] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const [error, setError] = useState('')
  const fetchedRef = useRef<{ q: string; p: number } | null>(null)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [selected] = useState<SearchResult | null>(null)

  // LOGS para debug

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/search')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) {
      return
    }
    const q = searchParams.get('query') || ''
    const p = Number(searchParams.get('page')) || 1
    setQuery(q)
    setPage(p)
    if (
      q.length >= 2 &&
      (!fetchedRef.current || fetchedRef.current.q !== q || fetchedRef.current.p !== p)
    ) {
      setLoading(true)
      fetchResults(q, p)
      fetchedRef.current = { q, p }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  async function fetchResults(q: string, p: number) {
    setError('')
    try {
      let headers: Record<string, string> = { 'Content-Type': 'application/json' }
      let accessToken = undefined
      if (user) {
        // @ts-ignore
        accessToken = user?.access_token
        if (accessToken) {
          headers = { ...headers, Authorization: `Bearer ${accessToken}` }
        }
      }
      const response = await fetch(`/api/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: q, limit: PAGE_SIZE, page: p }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          router.push(
            '/login?redirect=/search' + (query ? `?query=${encodeURIComponent(query)}` : '')
          )
          setLoading(false)
          return
        }
        throw new Error(data.error || 'Erro desconhecido')
      }
      setResults(data.results)
      setTotal(data.total)
      setForceUpdate(f => f + 1) // força re-render
    } catch (e: unknown) {
      const error = e as Error
      setResults([])
      setTotal(0)
      setError(error.message || 'Erro ao buscar')
    } finally {
      setLoading(false)
    }
  }

  function handleFavorite() {
    setIsFavorite(fav => !fav)
  }

  function handleGoToSiman() {
    if (selected && selected.simanId) {
      router.push(
        `/livros/1/divisoes/${encodeURIComponent(selected.tratado)}/siman/${selected.simanId}`
      )
      setModalOpen(false)
    }
  }

  async function handleVerExplicacaoPratica() {
    setLoadingExplicacao(true)
    setExplicacaoPratica(undefined)
    if (!user || !selected || !selected.simanId) {
      setExplicacaoPratica('Faça login para ver a explicação prática.')
      setLoadingExplicacao(false)
      return
    }
    try {
      const response = await fetch('/api/explicacao-pratica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, simanId: selected.simanId, seif: selected.seif }),
      })
      const data = await response.json()
      if (data.error) {
        setExplicacaoPratica(data.error)
      } else {
        setExplicacaoPratica(data.practical_explanation || 'Sem explicação prática.')
      }
    } catch (e) {
      setExplicacaoPratica('Erro ao buscar explicação prática.')
    } finally {
      setLoadingExplicacao(false)
    }
  }

  function handlePageChange(newPage: number) {
    router.push(`/search?query=${encodeURIComponent(query)}&page=${newPage}`)
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="rounded-full bg-blue-500 p-3">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Busca nos Tratados</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Encontre informações específicas nos textos de Halachá
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-lg text-gray-600">Buscando nos tratados...</p>
            </div>
          ) : (
            <>
              {results.length === 0 && !error && (
                <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-lg text-center">
                  <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0112 4c-2.34 0-4.29 1.009-5.824 2.709" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-gray-600">Tente usar termos diferentes ou verifique a ortografia.</p>
                </div>
              )}
              {error && (
                <div className="mx-auto max-w-2xl rounded-xl bg-red-50 border border-red-200 p-8 shadow-lg text-center">
                  <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-red-800 mb-2">Erro na busca</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              )}
              <SearchResults
                results={results}
                query={query}
                total={total}
                page={page}
                onPageChange={handlePageChange}
                pageSize={PAGE_SIZE}
                key={forceUpdate}
              />
            </>
          )}
        </div>
        {selected && (
          <SeifModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            tratado={selected.tratado}
            siman={selected.siman}
            seif={selected.seif}
            content={selected.content}
            isFavorite={isFavorite}
            onFavorite={handleFavorite}
            onGoToSiman={handleGoToSiman}
            explicacaoPratica={explicacaoPratica}
            onVerExplicacaoPratica={handleVerExplicacaoPratica}
            loadingExplicacao={loadingExplicacao}
          />
        )}
      </main>
      <Footer />
    </>
  )
}
