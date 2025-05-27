import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchDialogProps } from '@/app/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function search(): Promise<{ matches: { bookId: string; chapterId: string }[] }> {
  // Simula um resultado de busca
  return { matches: [] }
}

export default function SearchDialog({ openFromFavoritos }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const result = await search()
      if (result.matches.length > 0 && result.matches[0]) {
        const match = result.matches[0]
        router.push(
          `/livros/${match.bookId}/capitulos/${match.chapterId}${openFromFavoritos ? '?openFromFavoritos=true' : ''}`
        )
      }
      setSearchQuery('')
    } catch (err) {
      setError('Erro ao buscar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Buscar Halachá</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Onde encontro as leis de..."
            className="w-full rounded border p-2"
            role="searchbox"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-blue-500 p-2 text-white disabled:opacity-50"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  )
}
