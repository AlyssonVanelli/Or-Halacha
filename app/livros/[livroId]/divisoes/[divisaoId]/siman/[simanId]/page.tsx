'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/DashboardHeader'
import { BookAccessGuard } from '@/components/BookAccessGuard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Star } from 'lucide-react'
import type { PageProps } from '@/app/types'

function capitalizeSimanTitle(text: string) {
  // Troca 'SIMAN' por 'Siman' apenas no início da string
  return text.replace(/^SIMAN/, 'Siman')
}

// Definir interface Siman e tipar useState corretamente
interface Siman {
  id: string
  title: string
  content?: { content: string } | null
  position?: number
}

// Definir interface Seif e tipar selectedSeif corretamente
interface Seif {
  number: number
  text: string
}

function ParametrosInvalidos() {
  return <div>Parâmetros inválidos</div>
}

function SimanPageContent({
  livroId,
  divisaoId,
  simanId,
  searchParams,
}: {
  livroId: string
  divisaoId: string
  simanId: string
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const [siman, setSiman] = useState<Siman | null>(null)
  const [simanim, setSimanim] = useState<Siman[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [explicacaoModalOpen, setExplicacaoModalOpen] = useState(false)
  const [selectedSeif, setSelectedSeif] = useState<Seif | null>(null)
  const [explicacao, setExplicacao] = useState<string>('')
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    async function loadSimanAndSimanim() {
      try {
        const supabase = createClient()
        // Busca o siman atual
        const { data: simanData } = await supabase
          .from('chapters')
          .select(
            `
            id,
            title,
            content:content_chapter_id_fkey (
              content
            )
          `
          )
          .eq('id', simanId)
          .single()
        if (simanData) {
          // Ajusta o campo content para ser { content: string } | null
          let contentObj: { content: string } | null = null
          if (Array.isArray(simanData.content)) {
            contentObj = simanData.content[0] ? { content: simanData.content[0].content } : null
          } else if (simanData.content && typeof simanData.content === 'object') {
            contentObj = simanData.content as { content: string }
          }
          setSiman({ ...simanData, content: contentObj })
        }
        // Busca todos os simanim da divisão
        const { data: simanimData } = await supabase
          .from('chapters')
          .select('id, title, position')
          .eq('division_id', divisaoId)
          .order('position', { ascending: true })
        if (simanimData) setSimanim(simanimData)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    loadSimanAndSimanim()
  }, [simanId, divisaoId])

  useEffect(() => {
    async function checkFavorite() {
      if (user && selectedSeif) {
        const supabase = createClient()
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('chapter_id', simanId)
          .eq('seif_number', selectedSeif.number)
          .maybeSingle()
        setIsFavorite(!!data)
      }
    }
    checkFavorite()
  }, [user, selectedSeif, simanId, modalOpen])

  // Detectar parâmetro 'seif' na URL e abrir modal automaticamente
  useEffect(() => {
    if (searchParams && searchParams['seif'] && siman?.content?.content) {
      const seifNumber = parseInt(searchParams['seif'] as string, 10)
      if (!isNaN(seifNumber)) {
        // Encontrar o seif específico no conteúdo
        const seifim: Array<{ number: number; text: string }> = []
        const regex = /\n?(\d+)\.\s/g
        let match
        let lastIndex = 0
        let lastNumber = 1
        let encontrouSeif = false
        let primeiro = true

        while ((match = regex.exec(siman.content.content)) !== null) {
          encontrouSeif = true
          const number = parseInt(match[1] ?? '0', 10)
          if (!primeiro) {
            const text = siman.content.content.slice(lastIndex, match.index).trim()
            if (text) {
              seifim.push({ number: lastNumber, text })
            }
          } else {
            primeiro = false
          }
          lastNumber = number
          lastIndex = match.index + match[0].length
        }

        if (encontrouSeif && lastIndex < siman.content.content.length) {
          const text = siman.content.content.slice(lastIndex).trim()
          if (text) {
            seifim.push({ number: lastNumber, text })
          }
        }

        // Se não encontrou seif numerado, dividir por parágrafos
        if (!encontrouSeif) {
          const paragrafos = siman.content.content
            .split(/\n{2,}/)
            .map(p => p.trim())
            .filter(Boolean)
          paragrafos.forEach((text, idx) => {
            seifim.push({
              number: idx + 1,
              text,
            })
          })
        }

        // Encontrar o seif específico
        const seifEncontrado = seifim.find(s => s.number === seifNumber)
        if (seifEncontrado) {
          setSelectedSeif({ number: seifEncontrado.number, text: seifEncontrado.text })
          setModalOpen(true)
        }
      }
    }
  }, [searchParams, siman])

  if (loading)
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  if (!siman) return <div>Siman não encontrado.</div>

  // Extrair o título do conteúdo (primeira linha do texto)
  let simanContentTitle = ''
  let simanContentBody = ''
  if (siman?.content?.content) {
    const lines = (siman.content.content ?? '').split(/\r?\n/)
    if (lines.length > 0) {
      simanContentTitle = capitalizeSimanTitle(lines[0] ?? '')
      simanContentBody = lines.slice(1).join('\n')
    }
  }

  // Navegação: encontrar índice do siman atual
  const currentIdx = simanim.findIndex(s => s.id === simanId)
  const prevSiman = currentIdx > 0 ? simanim[currentIdx - 1] : null
  const nextSiman =
    currentIdx >= 0 && currentIdx < simanim.length - 1 ? simanim[currentIdx + 1] : null

  // Função para favoritar um seif
  async function favoritarSeif() {
    if (!user || !selectedSeif) return
    if (!selectedSeif?.number) {
      toast({
        title: 'Não é possível favoritar este seif',
        description: 'Este seif não possui número.',
      })
      return
    }
    // Log para debug
    try {
      const supabase = createClient()
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('chapter_id', simanId)
          .eq('seif_number', selectedSeif.number)
        toast({ title: 'Removido dos favoritos' })
        setIsFavorite(false)
      } else {
        const { error } = await supabase.from('favorites').upsert(
          [
            {
              user_id: user.id,
              chapter_id: simanId,
              seif_number: selectedSeif.number,
              created_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'user_id,chapter_id,seif_number' }
        )
        if (error) throw error
        toast({ title: 'Favoritado!', description: 'Seif adicionado aos favoritos.' })
        setIsFavorite(true)
      }
    } catch (e) {
      toast({ title: 'Erro ao favoritar', description: 'Tente novamente.' })
    }
  }
  // Função para ver explicação prática
  async function verExplicacaoPratica() {
    if (!user || !selectedSeif) return
    // Verifica se o usuário tem assinatura ativa (Plus)
    const supabase = createClient()
    const { data: assinatura } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (!assinatura || !assinatura.explicacao_pratica) {
      toast({
        title: 'Exclusivo do Plano Plus',
        description: (
          <span>
            A explicação prática está disponível apenas para assinantes do plano Plus.
            <br />
            <button
              onClick={async () => {
                const res = await fetch('/api/upgrade-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ customerId: assinatura?.stripe_customer_id }),
                })
                const data = await res.json()
                if (data.url) window.location.href = data.url
              }}
              className="mt-2 inline-block rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Quero ser Plus
            </button>
          </span>
        ),
        variant: 'destructive',
      })
      return
    }
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('practical_explanation')
        .eq('chapter_id', simanId)
        .eq('number', selectedSeif.number)
        .single()
      if (error || !data?.practical_explanation) {
        toast({
          title: 'Sem explicação prática',
          description: 'Não há explicação cadastrada para este seif.',
        })
        setModalOpen(false)
        return
      }
      setExplicacao(data.practical_explanation)
      setModalOpen(false)
      setTimeout(() => setExplicacaoModalOpen(true), 300)
    } catch (e) {
      toast({ title: 'Erro ao buscar explicação prática' })
      setModalOpen(false)
    }
  }

  return (
    <BookAccessGuard bookId={livroId}>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <DashboardHeader />
        <main className="flex-1">
          <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href={`/livros/${livroId}/divisoes/${divisaoId}`}
                className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Voltar para a lista de Simanim
              </Link>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-500 p-3">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">
                    {simanContentTitle || 'Siman'}
                  </h1>
                  <p className="mt-2 text-lg text-gray-600">Clique em um seif para ver detalhes</p>
                </div>
              </div>
            </div>

            {/* Conteúdo do Siman */}
            <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-lg">
              <div className="prose dark:prose-invert mx-auto max-w-none text-lg leading-8">
                {simanContentBody ? (
                  <div>
                    {(() => {
                      // Novo parser de seifim: associa corretamente número e texto
                      const seifim: Array<{ number: number; text: string }> = []
                      const regex = /\n?(\d+)\.\s/g
                      let match
                      let lastIndex = 0
                      let lastNumber = 1
                      let encontrouSeif = false
                      let primeiro = true
                      while ((match = regex.exec(simanContentBody)) !== null) {
                        encontrouSeif = true
                        const number = parseInt(match[1] ?? '0', 10)
                        if (!primeiro) {
                          // O texto entre o último match e o atual pertence ao seif anterior
                          const text = simanContentBody.slice(lastIndex, match.index).trim()
                          if (text) {
                            seifim.push({ number: lastNumber, text })
                          }
                        } else {
                          // Ignora introdução antes do primeiro seif numerado
                          primeiro = false
                        }
                        lastNumber = number
                        lastIndex = match.index + match[0].length
                      }
                      // Adiciona o último seif, se houver
                      if (encontrouSeif && lastIndex < simanContentBody.length) {
                        const text = simanContentBody.slice(lastIndex).trim()
                        if (text) {
                          seifim.push({ number: lastNumber, text })
                        }
                      }
                      // Se não encontrou nenhum seif numerado, divide por parágrafos e atribui número incremental
                      if (!encontrouSeif) {
                        const paragrafos = simanContentBody
                          .split(/\n{2,}/)
                          .map(p => p.trim())
                          .filter(Boolean)
                        paragrafos.forEach((text, idx) => {
                          seifim.push({
                            number: idx + 1,
                            text,
                          })
                        })
                      }
                      return seifim.map((seif, idx) => (
                        <div
                          key={seif.number + '-' + idx} // Garante key única
                          className="group mb-4 cursor-pointer select-none rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-blue-300 hover:shadow-md"
                          onClick={() => {
                            setSelectedSeif({ number: seif.number, text: seif.text })
                            setModalOpen(true)
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                              {seif.number}
                            </div>
                            <div className="flex-1">
                              <div className="leading-relaxed text-gray-800">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: seif.text.replace(/\n/g, '<br>'),
                                  }}
                                />
                              </div>
                              <div className="mt-2 text-sm text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
                                Clique para ver detalhes
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                ) : (
                  <p>Conteúdo em breve...</p>
                )}
              </div>
              {/* Navegação entre simanim */}
              <div className="mt-10 flex justify-between">
                {prevSiman ? (
                  <Link
                    href={`/livros/${livroId}/divisoes/${divisaoId}/siman/${prevSiman.id}`}
                    className="rounded border border-blue-600 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    ← Anterior
                  </Link>
                ) : (
                  <div />
                )}
                {nextSiman ? (
                  <Link
                    href={`/livros/${livroId}/divisoes/${divisaoId}/siman/${nextSiman.id}`}
                    className="rounded border border-blue-600 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    Próximo →
                  </Link>
                ) : (
                  <div />
                )}
              </div>
              {/* Modal de opções do seif */}
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>O que deseja fazer?</DialogTitle>
                  </DialogHeader>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      Seif selecionado:
                      <button
                        onClick={favoritarSeif}
                        className="ml-2 flex items-center gap-1"
                        title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                      >
                        <Star
                          className={
                            isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                          }
                          fill={isFavorite ? '#facc15' : 'none'}
                        />
                        <span
                          className={isFavorite ? 'font-semibold text-yellow-600' : 'text-gray-500'}
                        >
                          Favoritar
                        </span>
                      </button>
                    </div>
                    <div
                      className="rounded bg-slate-100 p-2 text-base"
                      style={{ userSelect: 'none' }}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: selectedSeif?.text?.replace(/\n/g, '<br>') || '',
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col gap-2">
                    <Button variant="default" onClick={verExplicacaoPratica}>
                      Ver Explicação Prática
                    </Button>
                    {searchParams && searchParams['openFromFavoritos'] && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setModalOpen(false)
                          // Scroll para o seif na página do siman
                          const el = document.getElementById(`seif-${selectedSeif?.number}`)
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                      >
                        Ir para o Siman
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Modal de explicação prática */}
              <Dialog
                open={explicacaoModalOpen}
                onOpenChange={open => {
                  setExplicacaoModalOpen(open)
                  if (!open) setExplicacao('')
                }}
              >
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Explicação Prática</DialogTitle>
                  </DialogHeader>
                  <div
                    className="mb-4 rounded bg-slate-100 p-2 text-base"
                    style={{ userSelect: 'none' }}
                  >
                    <div className="mb-2 font-semibold">Seif:</div>
                    <div
                      className="mb-4"
                      dangerouslySetInnerHTML={{
                        __html: selectedSeif?.text?.replace(/\n/g, '<br>') || '',
                      }}
                    />
                    <div className="mb-2 font-semibold">Explicação:</div>
                    <div dangerouslySetInnerHTML={{ __html: explicacao.replace(/\n/g, '<br>') }} />
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setExplicacaoModalOpen(false)}>
                      Fechar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </BookAccessGuard>
  )
}

export default function SimanPage({ params, searchParams }: PageProps) {
  const [resolvedParams, setResolvedParams] = useState<{
    livroId?: string
    divisaoId?: string
    simanId?: string
  } | null>(null)
  const [resolvedSearchParams, setResolvedSearchParams] = useState<{
    [key: string]: string | string[] | undefined
  }>({})

  useEffect(() => {
    const loadParams = async () => {
      const p = await params
      const sp = await searchParams
      setResolvedParams(p)
      setResolvedSearchParams(sp ?? {})
    }
    loadParams()
  }, [params, searchParams])

  if (!resolvedParams) {
    return <div>Carregando...</div>
  }

  if (!resolvedParams['livroId'] || !resolvedParams['divisaoId'] || !resolvedParams['simanId']) {
    return <ParametrosInvalidos />
  }

  return (
    <SimanPageContent
      livroId={resolvedParams['livroId']}
      divisaoId={resolvedParams['divisaoId']}
      simanId={resolvedParams['simanId']}
      searchParams={resolvedSearchParams}
    />
  )
}
