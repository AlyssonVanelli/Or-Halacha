import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SearchResult {
  tratado: string
  siman: string
  simanId: string
  seif: string
  content: string
  relevance: number
  context: string
  livroId?: string
  divisaoId?: string
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  total: number
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
}

export function SearchResults({
  results,
  query,
  total,
  page = 1,
  onPageChange,
  pageSize = 10,
}: SearchResultsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [explicacao, setExplicacao] = useState<string>('')
  const [loadingExplicacao, setLoadingExplicacao] = useState(false)
  const [seifCompleto, setSeifCompleto] = useState<string>('')
  const [explicacaoModalOpen, setExplicacaoModalOpen] = useState(false)

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="mb-4 text-center text-2xl font-semibold">Faça login para acessar a busca</h2>
        <p className="mb-6 max-w-md text-center text-gray-600">
          O recurso de busca está disponível apenas para usuários autenticados.
          <br />
          Por favor, faça login para continuar.
        </p>
        <button
          className="rounded bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
          onClick={() => router.push('/login')}
        >
          Fazer login
        </button>
      </div>
    )
  }

  async function handleOpenModal(result: SearchResult) {
    setSelected(result)
    setModalOpen(true)
    setExplicacao('')
    setSeifCompleto('')
    const supabase = createClient()
    if (user) {
      const { data: fav } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('chapter_id', result.simanId)
        .eq('seif_number', Number(result.seif))
        .maybeSingle()
      setIsFavorite(!!fav)
    } else {
      setIsFavorite(false)
    }
    const { data: section } = await supabase
      .from('sections')
      .select('content')
      .eq('chapter_id', result.simanId)
      .eq('number', Number(result.seif))
      .maybeSingle()
    setSeifCompleto(section?.content || result.content)
  }

  async function favoritarSeif() {
    if (!user) {
      toast({
        title: 'Faça login para favoritar',
        description: 'Você precisa estar logado para favoritar um seif.',
        variant: 'destructive',
      })
      return
    }
    if (!selected) return
    const supabase = createClient()
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('chapter_id', selected.simanId)
          .eq('seif_number', Number(selected.seif))
        if (error) throw error
        toast({ title: 'Removido dos favoritos' })
        setIsFavorite(false)
      } else {
        const { error } = await supabase.from('favorites').upsert(
          [
            {
              user_id: user.id,
              chapter_id: selected.simanId,
              seif_number: Number(selected.seif),
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

  async function verExplicacaoPratica() {
    if (!user) {
      toast({
        title: 'Faça login para acessar',
        description: 'Você precisa estar logado para ver a explicação prática.',
        variant: 'destructive',
      })
      return
    }
    if (!selected) return
    setLoadingExplicacao(true)
    setExplicacao('')
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
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('stripe_customer_id')
                  .eq('id', user.id)
                  .maybeSingle()
                if (!profile?.stripe_customer_id) return
                const res = await fetch('/api/upgrade-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ customerId: profile.stripe_customer_id }),
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
      setLoadingExplicacao(false)
      return
    }
    const { data } = await supabase
      .from('sections')
      .select('practical_explanation')
      .eq('chapter_id', selected.simanId)
      .eq('number', Number(selected.seif))
      .single()
    setExplicacao(data?.practical_explanation || 'Sem explicação prática.')
    setLoadingExplicacao(false)
    setModalOpen(false)
    setTimeout(() => setExplicacaoModalOpen(true), 300)
  }

  async function handleGoToSiman() {
    if (!selected) return
    let livroId = selected.livroId
    let divisaoId = selected.divisaoId
    const supabase = createClient()
    if (!divisaoId) {
      const { data: chapter } = await supabase
        .from('chapters')
        .select('division_id')
        .eq('id', selected.simanId)
        .maybeSingle()
      divisaoId = chapter?.division_id
    }
    if (!livroId && divisaoId) {
      const { data: division } = await supabase
        .from('divisions')
        .select('book_id')
        .eq('id', divisaoId)
        .maybeSingle()
      livroId = division?.book_id
    }
    if (livroId && divisaoId && selected.simanId) {
      router.push(`/livros/${livroId}/divisoes/${divisaoId}/siman/${selected.simanId}`)
      setModalOpen(false)
    } else {
      toast({ title: 'Erro ao navegar para o Siman', variant: 'destructive' })
    }
  }

  if (!results.length) return null

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Resultados para `{query}`</h2>
        <Badge variant="secondary">
          {total} {total === 1 ? 'resultado' : 'resultados'}
        </Badge>
      </div>
      {results.map((result, index) => (
        <div
          key={`${result.tratado}-${result.siman}-${result.seif}-${index}`}
          className="mb-4 cursor-pointer"
          onClick={() => handleOpenModal(result)}
        >
          <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-bold">
                {result.tratado} - Siman {result.siman}
                {result.seif !== '0' && `, Seif ${result.seif}`}
              </span>
            </div>
            <p className="mb-2 text-base font-medium">{result.content.slice(0, 180)}</p>
          </div>
        </div>
      ))}
      {total > pageSize && onPageChange && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
            Anterior
          </Button>
          <span className="rounded bg-muted px-4 py-2 text-muted-foreground">
            Página {page} de {Math.ceil(total / pageSize)}
          </span>
          <Button
            variant="outline"
            disabled={page === Math.ceil(total / pageSize)}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
      {selected && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selected.tratado} - Siman {selected.siman}
                {selected.seif && `, Seif ${selected.seif}`}
              </DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <button
                  onClick={favoritarSeif}
                  className="ml-2 flex items-center gap-1"
                  title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                >
                  <Star
                    className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                    fill={isFavorite ? '#facc15' : 'none'}
                  />
                  <span className={isFavorite ? 'font-semibold text-yellow-600' : 'text-gray-500'}>
                    Favoritar
                  </span>
                </button>
                <Button variant="outline" onClick={handleGoToSiman}>
                  Ir para Siman
                </Button>
              </div>
              <div className="rounded bg-slate-100 p-2 text-base" style={{ userSelect: 'none' }}>
                <span
                  dangerouslySetInnerHTML={{
                    __html: seifCompleto?.replace(/\n/g, '<br>') || '',
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2">
              <Button variant="default" onClick={verExplicacaoPratica} disabled={loadingExplicacao}>
                {loadingExplicacao ? 'Carregando...' : 'Ver Explicação Prática'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={explicacaoModalOpen}
        onOpenChange={open => {
          setExplicacaoModalOpen(open)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Explicação Prática</DialogTitle>
          </DialogHeader>
          <div className="mb-4 rounded bg-slate-100 p-2 text-base" style={{ userSelect: 'none' }}>
            <div className="mb-2 font-semibold">Seif:</div>
            <div
              className="mb-4"
              dangerouslySetInnerHTML={{
                __html: seifCompleto?.replace(/\n/g, '<br>') || '',
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
    </>
  )
}
