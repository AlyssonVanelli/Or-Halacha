'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { useAuth } from '@/contexts/auth-context'
import { tratadoHref } from '@/components/content/SimanReader'

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
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasedBooks, setPurchasedBooks] = useState<string[]>([])
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

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
          return
        }

        if (data) {
          setBook(data)
        }
      } catch (error) {
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
        .eq('user_id', user?.id)

      if (purchasedError) {
      } else {
        setPurchasedBooks(purchasedData?.map(p => p.division_id) || [])
      }

      // Verificar assinatura ativa
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      } else {
        setHasActiveSubscription(!!subscriptionData)
      }
    }
    loadUserData()
  }, [user])

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

                        <div className="mt-auto space-y-2">
                          <Link
                            href={tratadoHref(div.id)}
                            className="block w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-2 text-center text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
                          >
                            {unlocked ? 'Abrir' : 'Ver índice'}
                          </Link>
                          {!unlocked && (
                            <Link
                              href={
                                user
                                  ? `/checkout/${div.id}`
                                  : `/login?redirect=${encodeURIComponent(`/checkout/${div.id}`)}`
                              }
                              className="block w-full rounded-md border border-blue-200 px-2 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-50"
                            >
                              R$ 29,90 / 1 mês
                            </Link>
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
              © {new Date().getFullYear()} Or Halachá. Todos os direitos reservados.
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
