import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { simanHref } from '@/components/content/SimanReader'
import { findFolded } from '@/lib/content/format'

export interface SearchResult {
  tratado: string
  siman: string
  simanId: string
  divisaoId?: string | null
  seif: string
  content: string
  canRead?: boolean
  relevance: number
  context: string
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  total: number
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
}

// Destaca o termo buscado no trecho
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (q.length < 2) return <>{text}</>
  const idx = findFolded(text, q)
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-100 px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

export function SearchResults({
  results,
  query,
  total,
  page = 1,
  onPageChange,
  pageSize = 10,
}: SearchResultsProps) {
  if (!results.length) return null
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <p className="mb-4 text-gray-600" aria-live="polite">
        {total} {total === 1 ? 'resultado' : 'resultados'} para “{query}”
      </p>

      <ol className="space-y-3">
        {results.map((result, index) => (
          <li key={`${result.simanId}-${result.seif}-${index}`}>
            <Link
              href={simanHref(result.simanId, Number(result.seif) || undefined)}
              className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-blue-700">
                  {result.tratado} · Siman {result.siman}
                  {result.seif !== '0' && `, Seif ${result.seif}`}
                </span>
                {result.canRead === false && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    <Lock className="h-3 w-3" aria-hidden="true" /> amostra
                  </span>
                )}
              </div>
              <p className="leading-relaxed text-gray-700">
                <Highlight text={result.context} query={query} />
              </p>
            </Link>
          </li>
        ))}
      </ol>

      {totalPages > 1 && onPageChange && (
        <nav
          aria-label="Páginas de resultados"
          className="mt-8 flex items-center justify-center gap-4"
        >
          <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            ← Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima →
          </Button>
        </nav>
      )}
    </div>
  )
}
