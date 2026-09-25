'use client'

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { SearchResults, type SearchResult } from '@/components/SearchResults'

const PAGE_SIZE = 10
const SUGGESTIONS = ['Shabat', 'tefilin', 'mezuzá', 'kasher', 'Pessach', 'bênção']

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const urlQuery = searchParams.get('query') || ''
  const page = Number(searchParams.get('page')) || 1

  const [input, setInput] = useState(urlQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastFetch = useRef('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/search?query=${urlQuery}`)}`)
    }
  }, [authLoading, user, router, urlQuery])

  useEffect(() => setInput(urlQuery), [urlQuery])

  useEffect(() => {
    if (!user || urlQuery.trim().length < 2) {
      setResults([])
      setTotal(0)
      return
    }
    const key = `${urlQuery}|${page}`
    if (lastFetch.current === key) return
    lastFetch.current = key

    setLoading(true)
    setError('')
    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: urlQuery.trim(), limit: PAGE_SIZE, page }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao buscar')
        setResults(data.results)
        setTotal(data.total)
      })
      .catch((e: Error) => {
        setResults([])
        setTotal(0)
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [user, urlQuery, page])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = input.trim()
    if (q.length < 2) return
    router.push(`/search?query=${encodeURIComponent(q)}`)
  }

  function go(q: string) {
    router.push(`/search?query=${encodeURIComponent(q)}`)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Buscar no Shulchan Aruch</h1>
      <p className="mb-6 text-gray-600">
        Digite uma palavra ou tema em português. A busca procura em todos os seifim.
      </p>

      <form onSubmit={submit} role="search" className="mb-4 flex gap-2">
        <label htmlFor="busca" className="sr-only">
          Termo de busca
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="busca"
            type="search"
            value={input}
            onChange={e => setInput(e.target.value)}
            minLength={2}
            maxLength={100}
            placeholder="Ex.: acender velas de Shabat"
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <Button type="submit" size="lg" disabled={input.trim().length < 2}>
          Buscar
        </Button>
      </form>

      {!urlQuery && (
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Sugestões:</span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => go(s)}
              className="rounded-full border border-blue-200 bg-white px-3 py-1 text-blue-700 hover:bg-blue-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20" role="status">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Buscando…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      ) : urlQuery && results.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-semibold text-gray-800">
            Nenhum resultado para “{urlQuery}”
          </h2>
          <p className="text-gray-600">
            Tente outra palavra ou um termo mais geral (ex.: “Shabat”, “bênção”, “tefilin”).
          </p>
        </div>
      ) : (
        <SearchResults
          results={results}
          query={urlQuery}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={p => router.push(`/search?query=${encodeURIComponent(urlQuery)}&page=${p}`)}
        />
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    // Header e rodapé vêm de app/search/layout.tsx
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Suspense fallback={null}>
        <SearchContent />
      </Suspense>
    </div>
  )
}
