'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { db } from '@/lib/db'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Definir tipos explícitos para favoritos
interface Section {
  number: number
  content: string
}
interface Chapter {
  id: string
  title: string
  sections?: Section[]
  division_id?: string
  divisions?: { title: string }
  books?: { id: string; title: string }
}
interface Favorito {
  id: string
  seif_number: number
  chapters: Chapter
}

export default function FavoritosPage() {
  const { user, loading: authLoading } = useAuth()
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFav, setSelectedFav] = useState<(Favorito & { seifCompleto?: string }) | null>(
    null
  )
  const [isFavorite, setIsFavorite] = useState(false)
  const [explicacao, setExplicacao] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    if (lastUserIdRef.current === user.id) return // Evita busca duplicada
    lastUserIdRef.current = user.id
    setLoading(true)
    db.favorites
      .getByUserId(user.id)
      .then(favs => setFavoritos(favs))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Faça login para ver seus favoritos.</div>
  }

  async function favoritarSeif(fav: Favorito) {
    if (!user || !fav) return
    const supabase = createClient()
    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('chapter_id', fav.chapters.id)
        .eq('seif_number', fav.seif_number)
      setIsFavorite(false)
      setModalOpen(false)
      setFavoritos((prev: Favorito[]) =>
        prev.filter(f => !(f.chapters.id === fav.chapters.id && f.seif_number === fav.seif_number))
      )
    } else {
      await supabase.from('favorites').upsert(
        [
          {
            user_id: user.id,
            chapter_id: fav.chapters.id,
            seif_number: fav.seif_number,
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id,chapter_id,seif_number' }
      )
      setIsFavorite(true)
    }
  }

  async function verExplicacaoPratica(fav: Favorito) {
    if (!user || !fav) return
    const supabase = createClient()
    // Verifica se o usuário tem assinatura ativa (Plus)
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
            <a
              href="#"
              className="font-semibold text-blue-600 underline"
              onClick={async e => {
                e.preventDefault()
                const supabase = createClient()
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('stripe_customer_id')
                  .eq('id', user.id)
                  .maybeSingle()
                if (!profile?.stripe_customer_id) {
                  return
                }
                const res = await fetch('/api/upgrade-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ customerId: profile.stripe_customer_id }),
                })
                const data = await res.json()
                if (data.url) window.location.href = data.url
              }}
            >
              Clique aqui para fazer upgrade
            </a>
          </span>
        ),
        variant: 'destructive',
      })
      return
    }
    const { data } = await supabase
      .from('sections')
      .select('practical_explanation')
      .eq('chapter_id', fav.chapters.id)
      .eq('number', fav.seif_number)
      .single()
    setExplicacao(data?.practical_explanation || 'Sem explicação prática.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mb-8">
            <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-4xl font-bold text-transparent">
              Meus Favoritos
            </h1>
            <p className="text-gray-600">Seus capítulos e seifim favoritos para consulta rápida</p>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600">Carregando favoritos...</p>
            </div>
          ) : favoritos.length === 0 ? (
            <div className="py-20 text-center">
              <div className="rounded-xl bg-gradient-to-br from-white to-blue-50/30 p-12 shadow-lg">
                <Star className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">Nenhum favorito ainda</h3>
                <p className="text-gray-500">Comece a favoritar capítulos para vê-los aqui!</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {favoritos.map(fav => {
                // Buscar texto do seif pelo número real
                const seifResumo = fav.chapters?.sections
                  ? fav.chapters.sections
                      .find(s => s.number === fav.seif_number)
                      ?.content?.slice(0, 180) || 'Sem resumo do seif.'
                  : 'Sem resumo do seif.'
                // Buscar texto completo do seif pelo número real
                const seifCompleto = fav.chapters?.sections
                  ? fav.chapters.sections.find(s => s.number === fav.seif_number)?.content || ''
                  : ''
                return (
                  <Card
                    key={fav.id}
                    className="cursor-pointer border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-lg transition-all duration-300 hover:shadow-xl"
                    onClick={() => {
                      setSelectedFav({ ...fav, seifCompleto })
                      setModalOpen(true)
                      setIsFavorite(true)
                    }}
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">
                        {fav.chapters?.title?.replace(/(\d+)/, (m: string) =>
                          parseInt(m, 10).toString()
                        ) || 'Capítulo'}
                        {fav.seif_number && (
                          <span className="ml-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            Seif {fav.seif_number}
                          </span>
                        )}
                        {/* Nome da divisão */}
                        {fav.chapters?.divisions?.title && (
                          <div className="mt-2 text-sm font-medium text-gray-600">
                            {fav.chapters.divisions.title}
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription className="font-medium text-blue-600">
                        {fav.chapters?.books?.title || 'Livro'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm leading-relaxed text-gray-600">{seifResumo}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedFav({ ...fav, seifCompleto })
                          setModalOpen(true)
                          setIsFavorite(true)
                        }}
                      >
                        Ler agora
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
          {/* Modal do seif ao clicar no favorito */}
          {selectedFav && (
            <Dialog
              open={modalOpen}
              onOpenChange={open => {
                setModalOpen(open)
                if (!open) setExplicacao('')
              }}
            >
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Seif Favoritado</DialogTitle>
                </DialogHeader>
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <button
                      onClick={() => favoritarSeif(selectedFav)}
                      className="ml-2 flex items-center gap-1"
                      title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                    >
                      <Star
                        className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
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
                        __html: selectedFav.seifCompleto?.replace(/\n/g, '<br>') || '',
                      }}
                    />
                  </div>
                </div>
                <DialogFooter className="flex flex-col gap-2">
                  <Button variant="default" onClick={() => verExplicacaoPratica(selectedFav)}>
                    Ver Explicação Prática
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setModalOpen(false)
                      if (
                        selectedFav &&
                        selectedFav.chapters.books &&
                        selectedFav.chapters.division_id
                      ) {
                        // Redirecionar para o siman com o seif específico já aberto
                        router.push(
                          `/livros/${selectedFav.chapters.books.id}/divisoes/${selectedFav.chapters.division_id}/siman/${selectedFav.chapters.id}?seif=${selectedFav.seif_number}`
                        )
                      }
                    }}
                  >
                    Ir para o Siman
                  </Button>
                </DialogFooter>
                {explicacao && (
                  <div className="mt-4 rounded border bg-slate-50 p-2 text-base">
                    <div className="mb-2 font-semibold">Explicação Prática:</div>
                    <div dangerouslySetInnerHTML={{ __html: explicacao.replace(/\n/g, '<br>') }} />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  )
}
