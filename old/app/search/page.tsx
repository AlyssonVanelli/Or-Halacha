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
      <main className="min-h-screen bg-slate-50 py-8">
        <h1 className="mb-8 text-center text-4xl font-bold">Busca nos Tratados</h1>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {results.length === 0 && !error && (
              <div className="py-12 text-center text-lg text-muted-foreground">
                Nenhum resultado encontrado.
              </div>
            )}
            {error && <div className="py-12 text-center text-lg text-red-500">{error}</div>}
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
