'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Book } from '@/app/types'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function BookPage() {
  const params = useParams()
  const livroId = (params && params['livroId']) as string | undefined
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasedBooks, setPurchasedBooks] = useState<string[]>([])
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null)

  useEffect(() => {
    if (!livroId) return
    async function loadBook() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('books')
          .select(
            `
            id,
            title,
            description,
            author,
            divisions (
              id,
              title,
              slug,
              position,
              description
            )
          `
          )
          .eq('id', livroId)
          .single()

        if (error) {
          return
        }

        if (data) setBook(data)
      } catch (error) {
        return undefined
      } finally {
        setLoading(false)
      }
    }
    loadBook()
  }, [livroId])

  useEffect(() => {
    if (!user?.id) return
    async function checkPurchaseStatus() {
      if (!user?.id) return
      try {
        const supabase = createClient()
        const { data: purchases } = await supabase
          .from('purchases')
          .select('book_id')
          .eq('user_id', user.id)
          .eq('status', 'completed')

        if (purchases) {
          setPurchasedBooks(purchases.map(p => p.book_id))
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        setHasActiveSubscription(!!subscription)
      } catch (error) {
        return undefined
      }
    }
    checkPurchaseStatus()
  }, [user?.id])

  if (!livroId) return <div>Parâmetros inválidos</div>

  async function handlePurchase(divisionId: string) {
    if (!user) {
      window.location.href = '/login'
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
          bookId: livroId,
          divisionId: divisionId,
          successUrl: `${window.location.origin}/livros/${livroId}`,
          cancelUrl: `${window.location.origin}/livros/${livroId}`,
        }),
      })
      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      return undefined
    } finally {
      setLoadingPurchase(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Livro não encontrado</h2>
          <p className="mt-2 text-muted-foreground">
            O livro que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-block rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
            >
              ← Voltar para a Biblioteca
            </Link>
          </div>
          <h1 className="mb-2 text-center text-4xl font-bold">{book.title}</h1>
          {book.author && (
            <p className="mb-2 text-center text-lg text-muted-foreground">Autor: {book.author}</p>
          )}
          {book.description && (
            <div className="mb-6">
              <h3 className="mb-1 text-center text-lg font-semibold">Resumo</h3>
              <p className="text-center text-base text-gray-700">{book.description}</p>
            </div>
          )}
          <h2 className="mb-4 text-center text-2xl font-semibold">Tratados</h2>
          <div className="grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 md:grid-cols-2">
            {book.divisions
              ?.sort((a, b) => a.position - b.position)
              .map(div => {
                const unlocked = hasActiveSubscription || purchasedBooks.includes(div.id)
                return (
                  <div
                    key={div.id}
                    className="flex flex-col items-center justify-between rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-4">
                      <span className="mb-2 block text-lg font-semibold">{div.title}</span>
                      {div.description && (
                        <span className="mb-2 block text-sm text-gray-500">{div.description}</span>
                      )}
                    </div>
                    {unlocked ? (
                      <Link
                        href={`/livros/${livroId}/divisoes/${div.id}`}
                        className="inline-block rounded border border-blue-600 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        Acessar Tratado
                      </Link>
                    ) : (
                      <div className="flex w-full flex-col items-center gap-2">
                        <Button
                          className="mt-2 w-full"
                          onClick={() => handlePurchase(div.id)}
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
      </main>
    </div>
  )
}
