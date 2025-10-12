'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
// import { DynamicAccessBadge } from '@/components/AccessBadge'
import { ScreenCaptureProtection } from '@/components/ScreenCaptureProtection'
// import { useAccessInfo } from '@/hooks/useAccessInfo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock, ArrowLeft, Book, CheckCircle, XCircle, ShoppingCart, Loader2 } from 'lucide-react'

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
}

interface Subscription {
  id: string
  status: string
  explicacao_pratica: boolean
  current_period_end: string
}

export default function ShulchanAruchPage() {
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [purchasedBooks, setPurchasedBooks] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null)

  // Usar o hook para informações de acesso
  // const { accessInfo: userAccessInfo } = useAccessInfo(book?.id)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        const supabase = createClient()

        // Carregar livro Shulchan Aruch
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('title', 'Shulchan Aruch')
          .single()

        if (bookError) {
          return
        }

        setBook(bookData)

        // Carregar divisões do livro
        const { data: divisionsData, error: divisionsError } = await supabase
          .from('divisions')
          .select('*')
          .eq('book_id', bookData.id)
          .order('position')

        if (divisionsError) {
          return
        }

        setDivisions(divisionsData || [])

        // Carregar assinatura
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        setSubscription(subscriptionData)

        // Carregar livros comprados
        const { data: purchasedData } = await supabase
          .from('purchased_books')
          .select('division_id, expires_at')
          .eq('user_id', user.id)

        if (purchasedData) {
          const ativos = purchasedData.filter(pb => new Date(pb.expires_at) > new Date())
          setPurchasedBooks(ativos.map(pb => pb.division_id))
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const hasActiveSubscription =
    !!subscription &&
    subscription.status === 'active' &&
    (subscription.current_period_end
      ? new Date(subscription.current_period_end) > new Date()
      : true) // Se não tem data de fim, considera ativa

  const hasPlusFeatures = hasActiveSubscription && !!subscription?.explicacao_pratica
  const hasAccess = hasActiveSubscription || purchasedBooks.length > 0

  console.log('ShulchanAruchPage - Verificação de acesso:')
  console.log('- Subscription:', subscription)
  console.log('- Has active subscription:', hasActiveSubscription)
  console.log('- Has plus features:', hasPlusFeatures)
  console.log('- Has access:', hasAccess)
  console.log('- Purchased books count:', purchasedBooks.length)

  // Calcular porcentagem de acesso
  const calculateAccessPercentage = () => {
    if (hasActiveSubscription) {
      return 100 // Assinatura ativa = acesso completo
    }

    if (purchasedBooks.length === 0) {
      return 0 // Nenhum tratado comprado
    }

    // Calcular porcentagem baseada nos tratados comprados
    const totalDivisions = divisions.length
    const purchasedDivisions = purchasedBooks.length
    return Math.round((purchasedDivisions / totalDivisions) * 100)
  }

  const accessPercentage = calculateAccessPercentage()

  if (loading) {
    return (
      <DashboardAccessGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </DashboardAccessGuard>
    )
  }

  if (!hasAccess) {
    // Redirecionar para planos se não tem acesso
    return (
      <DashboardAccessGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Acesso Restrito</h2>
            <p className="mb-6 text-gray-600">
              Você precisa de uma assinatura para acessar este conteúdo.
            </p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">Ver Planos</Button>
            </Link>
          </div>
        </div>
      </DashboardAccessGuard>
    )
  }

  return (
    <DashboardAccessGuard>
      <ScreenCaptureProtection />
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="flex-1">
          <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a Biblioteca
              </Link>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-500 p-3">
                  <Book className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">{book?.title}</h1>
                  <p className="mt-2 text-lg text-gray-600">por {book?.author}</p>
                </div>
              </div>
            </div>

            {/* Estatísticas do Usuário */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center">
                  <div className="rounded-full bg-white/20 p-3">
                    <Book className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">Tratados Disponíveis</p>
                    <p className="text-2xl font-bold">{divisions.length}</p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl bg-gradient-to-r ${accessPercentage === 100 ? 'from-green-500 to-green-600' : accessPercentage > 0 ? 'from-yellow-500 to-orange-500' : 'from-gray-400 to-gray-500'} p-6 text-white`}
              >
                <div className="flex items-center">
                  <div className="rounded-full bg-white/20 p-3">
                    {accessPercentage === 100 ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : accessPercentage > 0 ? (
                      <Book className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">
                      {accessPercentage === 100 ? 'Acesso Completo' : 'Acesso Parcial'}
                    </p>
                    <p className="text-2xl font-bold">{accessPercentage}%</p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl bg-gradient-to-r ${hasPlusFeatures ? 'from-purple-500 to-purple-600' : 'from-gray-400 to-gray-500'} p-6 text-white`}
              >
                <div className="flex items-center">
                  <div className="rounded-full bg-white/20 p-3">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">Explicações Plus</p>
                    <p className="text-2xl font-bold">{hasPlusFeatures ? 'Ativo' : 'Inativo'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de Tratados */}
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 place-items-center gap-6 md:grid-cols-2 lg:grid-cols-4">
                {divisions.map((div, index) => {
                  const unlocked = hasActiveSubscription || purchasedBooks.includes(div.id)

                  const colors = [
                    'from-blue-500 to-blue-600',
                    'from-green-500 to-green-600',
                    'from-purple-500 to-purple-600',
                    'from-orange-500 to-orange-600',
                  ]

                  return (
                    <div
                      key={div.id}
                      className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      {/* Header com gradiente */}
                      <div className={`h-24 bg-gradient-to-r ${colors[index % colors.length]} p-6`}>
                        <div className="flex items-center justify-between">
                          <div className="rounded-full bg-white/20 p-2">
                            <Book className="h-6 w-6 text-white" />
                          </div>
                          {unlocked && (
                            <div className="rounded-full bg-green-500 p-1">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Conteúdo do card */}
                      <div className="p-6">
                        <h3 className="mb-2 text-xl font-bold text-gray-800">{div.title}</h3>
                        {div.description && (
                          <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                            {div.description}
                          </p>
                        )}

                        {/* Badges de recursos - apenas se tiver acesso */}
                        {unlocked && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {hasPlusFeatures ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                ✓ Explicações Práticas
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                ✗ Explicações Práticas
                              </span>
                            )}
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                              ✓ Pesquisa Avançada
                            </span>
                          </div>
                        )}

                        {/* Botão de ação */}
                        {unlocked ? (
                          <Link
                            href={`/dashboard/biblioteca/shulchan-aruch/${div.id}`}
                            className={`block w-full rounded-lg bg-gradient-to-r ${colors[index % colors.length]} px-4 py-3 text-center font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                          >
                            Acessar Tratado
                          </Link>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center text-gray-500">
                              <Lock className="mr-1 h-3 w-3" />
                              <span className="text-xs">Acesso bloqueado</span>
                            </div>
                            <button
                              onClick={async () => {
                                if (processingPurchase) return // Evitar múltiplos cliques

                                setProcessingPurchase(div.id)
                                try {
                                  // Redirecionar para página intermediária que então vai para o Stripe
                                  window.location.href = `/checkout/${div.id}`
                                } catch (error) {
                                  setProcessingPurchase(null)
                                }
                              }}
                              disabled={processingPurchase === div.id}
                              className={`block flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-center font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                                processingPurchase === div.id ? 'cursor-not-allowed opacity-75' : ''
                              }`}
                            >
                              {processingPurchase === div.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-4 w-4" />
                                  Comprar Tratado
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardAccessGuard>
  )
}
