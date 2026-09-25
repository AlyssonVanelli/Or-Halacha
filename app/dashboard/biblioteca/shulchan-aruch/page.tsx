'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Book, CheckCircle, Lightbulb, Lock, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Glossary } from '@/components/content/Glossary'
import { DIVISION_BLURBS } from '@/lib/content/divisions'
import { tratadoHref } from '@/components/content/SimanReader'

interface Division {
  id: string
  title: string
  position: number
  description: string | null
}

const COLORS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
]

export default function ShulchanAruchPage() {
  const { user } = useAuth()
  const [divisions, setDivisions] = useState<Division[]>([])
  const [hasSubscription, setHasSubscription] = useState(false)
  const [isPlus, setIsPlus] = useState(false)
  const [purchased, setPurchased] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    const now = new Date()

    Promise.all([
      supabase.from('divisions').select('id, title, position, description').order('position'),
      supabase
        .from('subscriptions')
        .select('status, current_period_end, explicacao_pratica')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      supabase.from('purchased_books').select('division_id, expires_at').eq('user_id', user.id),
    ])
      .then(([divs, sub, purchases]) => {
        setDivisions(divs.data || [])
        const active =
          !!sub.data &&
          (!sub.data.current_period_end || new Date(sub.data.current_period_end) > now)
        setHasSubscription(active)
        setIsPlus(active && !!sub.data?.explicacao_pratica)
        setPurchased(
          (purchases.data || []).filter(p => new Date(p.expires_at) > now).map(p => p.division_id)
        )
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="sr-only">Carregando biblioteca…</span>
      </div>
    )
  }

  const hasAnyAccess = hasSubscription || purchased.length > 0

  return (
    <div className="container max-w-6xl py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Shulchan Aruch</h1>
        <p className="mt-2 max-w-3xl text-lg text-gray-600">
          O código de lei judaica do Rabi Yossef Caro, com as notas do Rema, traduzido para o
          português. Escolha um tratado para ver o índice dos simanim.
        </p>
      </header>

      {!hasAnyAccess && (
        <div className="mb-6 flex flex-col items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-blue-900">
            Você pode navegar pelos índices e ler o primeiro seif de cada siman. Para ler tudo,
            escolha um plano ou compre um tratado.
          </p>
          <Button asChild>
            <Link href="/planos">Ver planos</Link>
          </Button>
        </div>
      )}

      {hasSubscription && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckCircle className="h-4 w-4" /> Acesso completo
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
              isPlus ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            {isPlus ? 'Explicações práticas ativas' : 'Explicações práticas no plano Plus'}
          </span>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {divisions.map((div, index) => {
          const unlocked = hasSubscription || purchased.includes(div.id)
          const blurb = DIVISION_BLURBS[div.title] || div.description
          return (
            <div
              key={div.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
            >
              <div
                className={`flex items-center justify-between bg-gradient-to-r ${COLORS[index % COLORS.length]} p-5 text-white`}
              >
                <div className="flex items-center gap-3">
                  <Book className="h-6 w-6" aria-hidden="true" />
                  <h2 className="text-xl font-bold">{div.title}</h2>
                </div>
                {unlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">
                    <CheckCircle className="h-4 w-4" /> Liberado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-xs font-semibold">
                    <Lock className="h-4 w-4" /> Amostra
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                {blurb && <p className="mb-5 flex-1 text-gray-600">{blurb}</p>}
                <div className="flex flex-col gap-2 xl:flex-row">
                  <Button asChild className="flex-1">
                    <Link href={tratadoHref(div.id)}>
                      {unlocked ? 'Abrir tratado' : 'Ver índice e amostra'}
                    </Link>
                  </Button>
                  {!unlocked && (
                    <Button variant="outline" asChild className="flex-1">
                      <Link href={`/checkout/${div.id}`}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Comprar este tratado · R$ 29,90
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Glossary />
    </div>
  )
}
