import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/contexts/SearchContext'

export function SearchDialog() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setResults } = useSearch()

  const handleSearch = async () => {
    if (!query) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar')
      }

      setResults(data.matches)
      if (data.matches.length > 0) {
        const match = data.matches[0]
        router.push(`/livros/${match.bookId}/capitulos/${match.chapterId}`)
      }
      setQuery('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <form
        role="search"
        onSubmit={e => {
          e.preventDefault()
          handleSearch()
        }}
      >
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar Halachá..."
            className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar Halachá"
            role="searchbox"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            role="button"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-red-500" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
