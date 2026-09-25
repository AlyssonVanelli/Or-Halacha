'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Glossary } from '@/components/content/Glossary'
import { simanHref } from '@/components/content/SimanReader'
import type { DivisionIndex } from '@/lib/content/server'
import { DIVISION_BLURBS } from '@/lib/content/divisions'

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function DivisionIndexView({
  divisionId,
  initialIndex,
}: {
  divisionId: string
  /** Índice já carregado no servidor (HTML inicial / SEO) */
  initialIndex?: DivisionIndex | null
}) {
  const { user } = useAuth()
  const [index, setIndex] = useState<DivisionIndex | null>(initialIndex ?? null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(initialIndex ? 'ok' : 'loading')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (initialIndex) return
    let cancelled = false
    setStatus('loading')
    fetch(`/api/conteudo/divisao/${divisionId}`)
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(json => {
        if (!cancelled) {
          setIndex(json)
          setStatus('ok')
        }
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [divisionId, initialIndex])

  const filtered = useMemo(() => {
    if (!index) return []
    const q = normalize(filter.trim())
    if (!q) return index.simanim
    return index.simanim.filter(s => String(s.number) === q || normalize(s.subject).includes(q))
  }, [index, filter])

  const libraryHref = user ? '/dashboard/biblioteca/shulchan-aruch' : '/livros'

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="sr-only">Carregando tratado…</span>
      </div>
    )
  }

  if (status === 'error' || !index) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="mb-3 text-2xl font-bold text-gray-800">Tratado não encontrado</h1>
        <Button variant="outline" asChild>
          <Link href={libraryHref}>Voltar para a biblioteca</Link>
        </Button>
      </div>
    )
  }

  const blurb = DIVISION_BLURBS[index.title] || index.description

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <Link
        href={libraryHref}
        className="mb-4 inline-flex items-center text-sm text-blue-700 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Shulchan Aruch
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{index.title}</h1>
        {blurb && <p className="mt-2 max-w-3xl text-lg text-gray-600">{blurb}</p>}
        <p className="mt-2 text-sm text-gray-500">{index.simanim.length} simanim</p>
      </header>

      <div className="mb-6">
        <Glossary />
      </div>

      <div className="relative mb-6">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <label htmlFor="filtro-simanim" className="sr-only">
          Procurar siman por número ou assunto
        </label>
        <input
          id="filtro-simanim"
          type="search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Procure por número ou assunto (ex.: 128, Shabat, tefilin)"
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-gray-500">Nenhum siman encontrado para “{filter}”.</p>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {filtered.map(s => (
            <li key={s.id}>
              <Link
                href={simanHref(s.id)}
                className="flex h-full items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {s.number}
                </span>
                <span>
                  <span className="block text-sm font-medium text-gray-500">Siman {s.number}</span>
                  <span className="block font-medium leading-snug text-gray-900">
                    {s.subject || `Siman ${s.number}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {!filter && index.appendices.length > 0 && (
        <section className="mt-12" aria-labelledby="apendices-titulo">
          <h2 id="apendices-titulo" className="mb-2 text-2xl font-bold text-gray-900">
            Apêndices
          </h2>
          <p className="mb-4 text-gray-600">Textos complementares do Shulchan Aruch.</p>
          <div className="space-y-4">
            {index.appendices.map(apx => (
              <details key={apx.type} className="rounded-xl border border-gray-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold text-gray-800">
                  {apx.type}{' '}
                  <span className="text-sm font-normal text-gray-500">
                    ({apx.simanim.length} simanim)
                  </span>
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {apx.simanim.map(s => (
                    <Link
                      key={s.id}
                      href={simanHref(s.id)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-sm hover:border-blue-300 hover:bg-blue-50"
                    >
                      {s.number}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
