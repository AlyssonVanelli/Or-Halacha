'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { simanHref } from '@/components/content/SimanReader'

interface Favorito {
  id: string
  simanId: string
  seif: number
  simanNumber: number | null
  divisionTitle: string | null
  text: string
  canRead: boolean
}

export default function FavoritosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    if (!user) return
    setStatus('loading')
    fetch('/api/favoritos', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(data => {
        setFavoritos(data.favorites)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [user])

  async function remover(fav: Favorito) {
    if (!user) return
    const { error } = await createClient().from('favorites').delete().eq('id', fav.id)
    if (error) {
      toast({ title: 'Não foi possível remover. Tente novamente.', variant: 'destructive' })
      return
    }
    setFavoritos(prev => prev.filter(f => f.id !== fav.id))
    toast({ title: 'Removido dos favoritos' })
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Meus favoritos</h1>
      <p className="mb-8 text-gray-600">
        Os seifim que você marcou com <Star className="inline h-4 w-4" aria-label="estrela" /> na
        leitura.
      </p>

      {status === 'loading' ? (
        <div className="flex justify-center py-20" role="status">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <span className="sr-only">Carregando favoritos…</span>
        </div>
      ) : status === 'error' ? (
        <p className="py-10 text-center text-red-600">Não foi possível carregar seus favoritos.</p>
      ) : favoritos.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <Star className="mx-auto mb-4 h-12 w-12 text-gray-300" aria-hidden="true" />
          <h2 className="mb-2 text-xl font-semibold text-gray-700">Nenhum favorito ainda</h2>
          <p className="mb-6 text-gray-500">
            Durante a leitura, toque na estrela ao lado de um seif para guardá-lo aqui.
          </p>
          <Button asChild>
            <Link href="/dashboard/biblioteca/shulchan-aruch">Ir para a biblioteca</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {favoritos.map(fav => (
            <li
              key={fav.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-2 text-sm font-semibold text-blue-700">
                {fav.divisionTitle ? `${fav.divisionTitle} · ` : ''}Siman {fav.simanNumber ?? '?'},
                Seif {fav.seif}
              </div>
              <p className="mb-4 line-clamp-4 flex-1 text-gray-700">
                {fav.text || 'Texto indisponível.'}
              </p>
              {!fav.canRead && (
                <p className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="h-3 w-3" aria-hidden="true" /> Trecho. Leitura completa com um
                  plano ou comprando este tratado.
                </p>
              )}
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={simanHref(fav.simanId, fav.seif)}>Ler no siman</Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => remover(fav)}
                  aria-label={`Remover seif ${fav.seif} dos favoritos`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
