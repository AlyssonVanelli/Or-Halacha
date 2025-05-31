import type { ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'

interface SearchResult {
  id: number
  title: string
  bookId: string
  chapterId: string
}

interface SearchContextData {
  results: SearchResult[]
  setResults: (results: SearchResult[]) => void
}

const SearchContext = createContext<SearchContextData>({} as SearchContextData)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<SearchResult[]>([])

  return <SearchContext.Provider value={{ results, setResults }}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = useContext(SearchContext)

  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }

  return context
}
