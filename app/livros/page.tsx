'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

interface Division {
  id: string
  title: string
  slug: string
  position: number
  description: string | null
}

interface Book {
  id: string
  title: string
  author: string
  description: string | null
  divisions: Division[]
}

export default function LivrosPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasedBooks, setPurchasedBooks] = useState<string[]>([])
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null)

  useEffect(() => {
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
          .eq('title', 'Shulchan Aruch') // Assume Shulchan Aruch é o livro principal
          .single()

        if (error) {
          console.error('Erro ao carregar livro:', error)
          return
        }

        if (data) {
          setBook(data)
        }
      } catch (error) {
        console.error('Erro inesperado ao carregar livro:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBook()
  }, [])

  useEffect(() => {
    if (!user?.id) return

    async function loadUserData() {
      const supabase = createClient()

      // Carregar livros comprados
      const { data: purchasedData, error: purchasedError } = await supabase
        .from('purchases')
        .select('division_id')
        .eq('user_id', user.id)

      if (purchasedError) {
        console.error('Erro ao carregar compras:', purchasedError)
      } else {
        setPurchasedBooks(purchasedData?.map(p => p.division_id) || [])
      }

      // Verificar assinatura ativa
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Erro ao carregar assinatura:', subscriptionError)
      } else {
        setHasActiveSubscription(!!subscriptionData)
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
          successUrl: `${window.location.origin}/livros`,
          cancelUrl: `${window.location.origin}/livros`,
        }),
      })
      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      console.error('Erro ao iniciar compra:', error)
    } finally {
      setLoadingPurchase(null)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">Livro não encontrado.</p>
      </div>
    )
  }

  return (
    <>
      <HeaderSimplificado />
      <div className="flex h-screen flex-col">
        <main className="flex flex-1 flex-col">
          <section className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 py-4 dark:from-slate-900 dark:to-slate-800">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mb-3">
                  <div className="mb-2 flex justify-center">
                    <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-2">
                      <svg
                        className="h-5 w-5 text-white"
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
                  </div>
                  <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl md:text-3xl">
                    Tratados do Shulchan Aruch
                  </h1>
                  <p className="mx-auto mt-2 max-w-[600px] text-sm text-gray-600">
                    Acesse os quatro tratados principais da Halachá em português, com explicações
                    práticas e navegação intuitiva.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full flex-1 py-6">
            <div className="w-full px-4">
              <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6">
                {book.divisions
                  .sort((a, b) => a.position - b.position)
                  .map(div => {
                    const unlocked = hasActiveSubscription || purchasedBooks.includes(div.id)
                    return (
                      <div
                        key={div.id}
                        className="group flex flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-300 hover:border-blue-200 hover:shadow-xl"
                      >
                        <div className="mb-3 flex justify-center">
                          <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-2">
                            <svg
                              className="h-5 w-5 text-white"
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
                        </div>

                        <div className="mb-4 text-center">
                          <h3 className="mb-1 text-lg font-bold text-gray-900">{div.title}</h3>
                          {div.description && (
                            <p className="text-xs text-gray-600">{div.description}</p>
                          )}
                        </div>

                        <div className="mt-auto">
                          {unlocked ? (
                            <Link
                              href={`/livros/${book.id}/divisoes/${div.id}`}
                              className="block w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-1.5 text-center text-xs font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
                            >
                              Acessar Tratado
                            </Link>
                          ) : (
                            <div className="space-y-1">
                              <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-1.5 text-xs font-semibold shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                                onClick={() => handlePurchase(div.id, book.id)}
                                disabled={loadingPurchase === div.id || hasActiveSubscription}
                              >
                                {loadingPurchase === div.id ? (
                                  <div className="flex items-center justify-center">
                                    <div className="mr-1 h-2 w-2 animate-spin rounded-full border border-white border-t-transparent" />
                                    Processando...
                                  </div>
                                ) : (
                                  'Assinar Tratado'
                                )}
                              </Button>
                              <div className="flex items-center justify-center text-gray-500">
                                <Lock className="mr-1 h-2 w-2" />
                                <span className="text-xs">Acesso limitado</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
              © 2025 Or Halachá. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link
                href="/termos"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacidade"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/suporte"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Suporte
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
