'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Lightbulb,
  Lock,
  Minus,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { RichText } from '@/components/content/RichText'
import { Glossary } from '@/components/content/Glossary'
import type { SimanDTO } from '@/lib/content/server'

const FONT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl'] as const
const FONT_KEY = 'or-halacha:tamanho-fonte'

function readFontIndex() {
  try {
    const v = Number(localStorage.getItem(FONT_KEY))
    return Number.isInteger(v) && v >= 0 && v < FONT_SIZES.length ? v : 1
  } catch {
    return 1
  }
}

export function simanHref(simanId: string, seif?: number) {
  return `/siman/${simanId}${seif ? `?seif=${seif}` : ''}`
}

export function tratadoHref(divisionId: string) {
  return `/tratado/${divisionId}`
}

export function SimanReader({ simanId, initialSeif }: { simanId: string; initialSeif?: number }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<SimanDTO | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [fontIndex, setFontIndex] = useState(1)
  const [openExplanations, setOpenExplanations] = useState<Set<number>>(new Set())
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [highlight, setHighlight] = useState<number | undefined>(initialSeif)

  useEffect(() => setFontIndex(readFontIndex()), [])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/conteudo/siman/${simanId}`, { cache: 'no-store' })
      if (res.status === 404) return setStatus('notfound')
      if (!res.ok) throw new Error(String(res.status))
      setData(await res.json())
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [simanId])

  // Recarrega quando o login muda (o acesso depende do usuário)
  useEffect(() => {
    load()
  }, [load, user?.id])

  useEffect(() => {
    if (!user) return setFavorites(new Set())
    createClient()
      .from('favorites')
      .select('seif_number')
      .eq('user_id', user.id)
      .eq('chapter_id', simanId)
      .then(({ data: rows }) => setFavorites(new Set((rows || []).map(r => r.seif_number))))
  }, [user, simanId])

  // Leva até o seif indicado na URL (?seif=N)
  useEffect(() => {
    if (status !== 'ok' || !initialSeif) return
    const el = document.getElementById(`seif-${initialSeif}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setHighlight(undefined), 4000)
    return () => clearTimeout(t)
  }, [status, initialSeif])

  function changeFont(delta: number) {
    setFontIndex(prev => {
      const next = Math.min(FONT_SIZES.length - 1, Math.max(0, prev + delta))
      try {
        localStorage.setItem(FONT_KEY, String(next))
      } catch {
        // armazenamento indisponível: mantém só na sessão
      }
      return next
    })
  }

  function toggleExplanation(n: number) {
    setOpenExplanations(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  async function toggleFavorite(n: number) {
    if (!user) {
      toast({ title: 'Entre na sua conta para salvar favoritos' })
      return
    }
    const supabase = createClient()
    const isFav = favorites.has(n)
    const { error } = isFav
      ? await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('chapter_id', simanId)
          .eq('seif_number', n)
      : await supabase
          .from('favorites')
          .upsert([{ user_id: user.id, chapter_id: simanId, seif_number: n }], {
            onConflict: 'user_id,chapter_id,seif_number',
          })
    if (error) {
      toast({ title: 'Não foi possível salvar. Tente novamente.', variant: 'destructive' })
      return
    }
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(n)
      else next.add(n)
      return next
    })
    toast({ title: isFav ? 'Removido dos favoritos' : 'Salvo nos favoritos' })
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="sr-only">Carregando siman…</span>
      </div>
    )
  }

  if (status === 'notfound' || status === 'error' || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="mb-3 text-2xl font-bold text-gray-800">
          {status === 'notfound' ? 'Siman não encontrado' : 'Não foi possível carregar o siman'}
        </h1>
        <p className="mb-6 text-gray-600">
          {status === 'notfound'
            ? 'O link pode estar incorreto.'
            : 'Verifique sua conexão e tente novamente.'}
        </p>
        <div className="flex justify-center gap-3">
          {status === 'error' && <Button onClick={load}>Tentar de novo</Button>}
          <Button variant="outline" asChild>
            <Link href={user ? '/dashboard/biblioteca/shulchan-aruch' : '/livros'}>
              Ir para a biblioteca
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const { access } = data
  const libraryHref = user ? '/dashboard/biblioteca/shulchan-aruch' : '/livros'
  const divisionHref = data.divisionId ? tratadoHref(data.divisionId) : libraryHref
  const lockedCount = data.totalSeifim - data.seifim.length
  const fontClass = FONT_SIZES[fontIndex]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      {/* Navegação */}
      <nav aria-label="Você está em" className="mb-4 text-sm text-gray-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href={libraryHref} className="hover:text-blue-700">
              Shulchan Aruch
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href={divisionHref} className="hover:text-blue-700">
              {data.divisionTitle || data.appendixType || 'Apêndice'}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="font-medium text-gray-900">
            Siman {data.number}
          </li>
        </ol>
      </nav>

      {/* Cabeçalho */}
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
            Siman {data.number}
          </span>
          {data.totalSeifim > 0 && (
            <span className="text-sm text-gray-500">
              {data.totalSeifim} {data.totalSeifim === 1 ? 'seif' : 'seifim'}
            </span>
          )}
          {access.isFreeToday && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              Grátis hoje
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold leading-snug text-gray-900 md:text-3xl">
          {data.subject || `Siman ${data.number}`}
        </h1>
      </header>

      {/* Ferramentas de leitura */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1" role="group" aria-label="Tamanho do texto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeFont(-1)}
            disabled={fontIndex === 0}
            aria-label="Diminuir texto"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="px-2 text-sm text-gray-600" aria-hidden="true">
            Aa
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeFont(1)}
            disabled={fontIndex === FONT_SIZES.length - 1}
            aria-label="Aumentar texto"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {access.canRead && access.isPlus && data.seifim.some(s => s.explanation) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setOpenExplanations(prev =>
                prev.size > 0
                  ? new Set()
                  : new Set(data.seifim.filter(s => s.explanation).map(s => s.number))
              )
            }
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            {openExplanations.size > 0 ? 'Ocultar explicações' : 'Mostrar todas as explicações'}
          </Button>
        )}
      </div>

      {data.translationPending ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="font-semibold">Tradução em revisão</p>
          <p className="mt-1 text-sm">
            Este siman está sendo revisado pela nossa equipe e estará disponível em breve.
          </p>
        </div>
      ) : (
        <article
          className={`space-y-4 ${fontClass} select-none leading-relaxed text-gray-800`}
          onCopy={e => e.preventDefault()}
        >
          {data.seifim.map(seif => {
            const isOpen = openExplanations.has(seif.number)
            return (
              <section
                key={seif.number}
                id={`seif-${seif.number}`}
                aria-labelledby={`seif-${seif.number}-titulo`}
                className={`scroll-mt-24 rounded-xl border bg-white p-5 shadow-sm transition-colors md:p-6 ${
                  highlight === seif.number
                    ? 'border-blue-400 ring-2 ring-blue-200'
                    : 'border-gray-200'
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2
                    id={`seif-${seif.number}-titulo`}
                    className="flex items-center gap-2 text-base font-semibold text-blue-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm">
                      {seif.number}
                    </span>
                    Seif {seif.number}
                  </h2>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(seif.number)}
                    className="rounded-full p-2 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-pressed={favorites.has(seif.number)}
                    aria-label={
                      favorites.has(seif.number)
                        ? `Remover seif ${seif.number} dos favoritos`
                        : `Salvar seif ${seif.number} nos favoritos`
                    }
                  >
                    <Star
                      className={`h-5 w-5 ${favorites.has(seif.number) ? 'fill-yellow-400 text-yellow-400' : ''}`}
                    />
                  </button>
                </div>

                <RichText text={seif.text} />

                {access.canRead && seif.hasExplanation && (
                  <div className="mt-4 border-t pt-3 text-base">
                    {seif.explanation ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExplanation(seif.number)}
                          aria-expanded={isOpen}
                          aria-controls={`explicacao-${seif.number}`}
                          className="flex items-center gap-2 font-medium text-emerald-700 hover:text-emerald-800"
                        >
                          <Lightbulb className="h-4 w-4" />
                          Explicação prática
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <div
                            id={`explicacao-${seif.number}`}
                            className={`mt-3 rounded-lg bg-emerald-50 p-4 ${fontClass} text-emerald-950`}
                          >
                            <RichText text={seif.explanation} />
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href="/planos"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-700"
                      >
                        <Sparkles className="h-4 w-4" />
                        Explicação prática deste seif disponível no plano Plus
                      </Link>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </article>
      )}

      {/* Conteúdo bloqueado */}
      {!access.canRead && lockedCount > 0 && (
        <div className="relative mt-4 overflow-hidden rounded-xl border-2 border-dashed border-blue-200 bg-gradient-to-b from-white to-blue-50 p-6 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-blue-600" aria-hidden="true" />
          <h2 className="text-xl font-bold text-gray-900">
            Continue lendo: mais {lockedCount} {lockedCount === 1 ? 'seif' : 'seifim'} neste siman
          </h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            {access.loggedIn
              ? 'Assine para ler todo o Shulchan Aruch em português ou compre apenas este tratado.'
              : 'Crie sua conta e escolha um plano para ler todo o Shulchan Aruch em português.'}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            {access.loggedIn ? (
              <>
                <Button asChild>
                  <Link href="/planos">Ver planos</Link>
                </Button>
                {data.divisionId && (
                  <Button variant="outline" asChild>
                    <Link href={`/checkout/${data.divisionId}`}>
                      Só {data.divisionTitle}: R$ 29,90 por 1 mês
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/signup">Criar conta</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login">Já tenho conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Siman anterior / próximo */}
      <nav aria-label="Navegar entre simanim" className="mt-8 flex justify-between gap-3">
        {data.prev ? (
          <Button variant="outline" asChild>
            <Link href={simanHref(data.prev.id)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Siman {data.prev.number}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        <Button variant="ghost" asChild>
          <Link href={divisionHref}>
            <BookOpen className="mr-2 h-4 w-4" />
            Índice
          </Link>
        </Button>
        {data.next ? (
          <Button variant="outline" asChild>
            <Link href={simanHref(data.next.id)}>
              Siman {data.next.number}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <span />
        )}
      </nav>

      <div className="mt-8">
        <Glossary />
      </div>
    </div>
  )
}
