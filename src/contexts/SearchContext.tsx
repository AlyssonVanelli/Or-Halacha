import React, { createContext, useContext, useState } from 'react'

interface SearchContextType {
  isLoading: boolean
  error: string | null
  search: (query: string) => Promise<void>
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao buscar')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SearchContext.Provider value={{ isLoading, error, search }}>{children}</SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch deve ser usado dentro de um SearchProvider')
  }
  return context
}
