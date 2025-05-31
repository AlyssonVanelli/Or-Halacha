'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Lock } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

interface Division {
  id: string
  title: string
  description: string | null
  cover_image?: string
  book_id: string
}

export default function LivrosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [divisions, setDivisions] = useState<Division[]>([])
  const [purchasedBooks, setPurchasedBooks] = useState<string[]>([])
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    async function loadDivisions() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('divisions')
          .select('id, title, description, book_id')
          .in('position', [1, 2, 3, 4])
          .order('position')
        if (error) {
          return
        }
        if (data) {
          setDivisions(data)
        }
      } catch (error) {
        return undefined
      }
    }
    loadDivisions()
  }, [])

  useEffect(() => {
    async function loadUserData() {
      if (!user) return
      try {
        const supabase = createClient()
        // Primeiro, verifica assinatura ativa
        const { data: assinatura } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
        const assinaturaAtiva = assinatura && new Date(assinatura.current_period_end) > new Date()
        setHasActiveSubscription(!!assinaturaAtiva)
        if (assinaturaAtiva) {
          setPurchasedBooks([])
          return
        }
        // Só consulta purchased_books se NÃO tiver assinatura ativa
        const { data: purchasedData } = await supabase
          .from('purchased_books')
          .select('division_id, expires_at')
          .eq('user_id', user.id)
        const ativos = (purchasedData || []).filter(pb => new Date(pb.expires_at) > new Date())
        setPurchasedBooks(ativos.map(pb => pb.division_id))
      } catch {
        setPurchasedBooks([])
      }
    }
    loadUserData()
  }, [user])

  async function handlePurchase(divisionId: string, bookId: string) {
    if (!user) {
      router.push('/login')
      return
    }
    if (hasActiveSubscription) {
      return
    }
    setLoadingPurchase(divisionId)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env['NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK'],
          userId: user.id,
          bookId: bookId,
          divisionId: divisionId,
          successUrl: `${window.location.origin}/livros/${bookId}`,
          cancelUrl: `${window.location.origin}/livros`,
        }),
      })
      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
    } finally {
      setLoadingPurchase(null)
    }
  }

  if (!divisions.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Livros</h1>
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Livros</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {divisions.map(div => {
          const unlocked = hasActiveSubscription || purchasedBooks.includes(div.id)
          return (
            <div key={div.id} className="rounded-lg bg-card p-6 shadow-md">
              <h2 className="mb-2 text-xl font-semibold">{div.title}</h2>
              <p className="mb-4 text-muted-foreground">{div.description}</p>
              {unlocked ? (
                <Link
                  href={`/livros/${div.book_id}/divisoes/${div.id}`}
                  className="inline-flex items-center text-primary hover:underline"
                >
                  Ver detalhes
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    className="mt-2 w-full"
                    onClick={() => handlePurchase(div.id, div.book_id)}
                    disabled={loadingPurchase === div.id || hasActiveSubscription}
                  >
                    {loadingPurchase === div.id ? (
                      <div className="flex items-center justify-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      'Comprar'
                    )}
                  </Button>
                  <div className="mt-2 flex items-center justify-center text-gray-400">
                    <Lock className="mr-1 h-5 w-5" />
                    <span>Bloqueado</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
