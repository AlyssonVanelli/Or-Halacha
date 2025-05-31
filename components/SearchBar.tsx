import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SearchResult {
  tratado: string
  siman: string
  seif: string
  content: string
  relevance: number
  context: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  tratado: string
}

interface SearchBarProps {
  onSearch: (query: string) => Promise<void>
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        })

        if (!response.ok) throw new Error('Erro na busca')

        const data: SearchResponse = await response.json()
        setResults(data.results)
        await onSearch(searchQuery)
      } catch (error) {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [onSearch]
  )

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery)
    }
  }, [debouncedQuery, search])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nos tratados..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar nos tratados..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {results.map((result, index) => (
                <CommandItem
                  key={`${result.tratado}-${result.siman}-${index}`}
                  onSelect={() => {
                    // Aqui você pode implementar a navegação para o resultado
                    setIsOpen(false)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {result.tratado} - Siman {result.siman}
                      {result.seif !== '0' && `, Seif ${result.seif}`}
                    </span>
                    <span className="text-sm text-muted-foreground">{result.content}</span>
                    <span className="mt-1 text-sm text-muted-foreground">{result.context}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
