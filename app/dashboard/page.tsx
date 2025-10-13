'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
// import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
import { DynamicAccessBadge } from '@/components/AccessBadge'
import { useAccessInfo } from '@/hooks/useAccessInfo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import TreatiseSelectionModal from '@/components/TreatiseSelectionModal'

export default function DashboardPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [hasPlusFeatures, setHasPlusFeatures] = useState(false)

  // Hook para informações de acesso do Shulchan Aruch
  const { accessInfo: userAccessInfo } = useAccessInfo()
  const [hasAnyAccess, setHasAnyAccess] = useState(false)
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [showTreatiseModal, setShowTreatiseModal] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      if (!user) return

      // Sempre verificar em tempo real - sem cache

      setIsCheckingAccess(true)
      try {
        // Usar API de verificação
        const response = await fetch('/api/check-user-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })

        if (response.ok) {
          const data = await response.json()
          const accessData = {
            hasActiveSubscription: data.access.hasActiveSubscription,
            hasPlusFeatures:
              data.access.hasActiveSubscription && data.supabase.subscription?.explicacao_pratica,
            hasAnyAccess: data.access.hasAnyAccess,
            purchasedBooks:
              data.supabase.purchasedBooks?.map((pb: { division_id: string }) => pb.division_id) ||
              [],
          }

          setHasPlusFeatures(accessData.hasPlusFeatures)
          setHasAnyAccess(accessData.hasAnyAccess)

          // Sem cache - dados sempre em tempo real
        }
      } catch (error) {
        setHasAnyAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    if (user) {
      loadUserData()
    }
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Dados básicos - sem complexidade
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSubscriptionCheckout(planType: string) {
    if (!user) {
      router.push('/login')
      return
    }

    // Se for tratado avulso, mostrar modal de seleção
    if (planType === 'tratado-avulso') {
      setShowTreatiseModal(true)
      return
    }

    setLoadingPurchase(planType)
    try {
      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planType,
          userEmail: user.email,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao criar sessão de checkout de assinatura')
      }

      const { url } = await response.json()
      if (url) {
        router.push(url)
      }
    } catch (error) {
      toast({
        title: 'Erro na assinatura',
        description: 'Não foi possível iniciar o processo de assinatura. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoadingPurchase(null)
    }
  }

  async function handleTreatiseSelection(treatiseId: string) {
    if (!user) {
      router.push('/login')
      return
    }

    setLoadingPurchase('tratado-avulso')
    setShowTreatiseModal(false)

    try {
      const response = await fetch('/api/create-treatise-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          divisionId: treatiseId,
          bookId: 'shulchan-aruch',
          userEmail: user.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao criar sessão de checkout de assinatura')
      }

      const responseData = await response.json()

      // Compra única - dados passados via URL

      if (responseData.url) {
        // Tratados avulsos agora são assinaturas reais no Stripe
        if (responseData.treatiseId) {
        }

        router.push(responseData.url)
      } else {
      }
    } catch (error) {
      toast({
        title: 'Erro na assinatura',
        description: 'Não foi possível iniciar o processo de assinatura. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoadingPurchase(null)
    }
  }

  if (isLoading || isCheckingAccess) {
    return (
      <DashboardAccessGuard>
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
          <main className="flex-1">
            <div className="container py-8">
              <div className="flex flex-col items-center justify-center py-32">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-600">
                  {isCheckingAccess ? 'Verificando assinatura...' : 'Carregando biblioteca...'}
                </p>
              </div>
            </div>
          </main>
        </div>
      </DashboardAccessGuard>
    )
  }

  return (
    <DashboardAccessGuard>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="flex-1">
          <div className="container py-8">
            {!hasAnyAccess ? (
              // Se não tem acesso, mostra planos
              <>
                <div className="mb-8 text-center">
                  <h1 className="mb-4 text-4xl font-bold text-gray-800">Escolha seu Plano</h1>
                  <p className="text-lg text-gray-600">
                    Para acessar os livros de Halachá, escolha um dos planos abaixo
                  </p>
                </div>

                {/* Grid de Planos */}
                <div className="mx-auto max-w-6xl">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {/* Plano Tratado Avulso */}
                    <div className="flex flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                      <div className="flex flex-1 flex-col text-center">
                        <h4 className="mb-2 text-xl font-bold text-gray-800">Tratado Avulso</h4>
                        <p className="mb-4 text-sm text-gray-600">Acesso a um tratado específico</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-blue-600">R$ 29,90</span>
                          <span className="text-gray-500">/mês</span>
                        </div>
                        <div className="mt-auto">
                          <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                            onClick={() => handleSubscriptionCheckout('tratado-avulso')}
                            disabled={loadingPurchase === 'tratado-avulso'}
                          >
                            {loadingPurchase === 'tratado-avulso'
                              ? 'Processando...'
                              : 'Assinar Tratado'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Plano Mensal Básico */}
                    <div className="flex flex-col rounded-xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
                      <div className="flex flex-1 flex-col text-center">
                        <h4 className="mb-2 text-xl font-bold text-gray-800">Mensal Básico</h4>
                        <p className="mb-4 text-sm text-gray-600">Acesso completo à biblioteca</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-blue-600">R$ 99,90</span>
                          <span className="text-gray-500">/mês</span>
                        </div>
                        <div className="mt-auto">
                          <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                            onClick={() => handleSubscriptionCheckout('mensal-basico')}
                            disabled={loadingPurchase === 'mensal-basico'}
                          >
                            {loadingPurchase === 'mensal-basico' ? 'Processando...' : 'Assinar Plano'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Plano Anual Básico */}
                    <div className="flex flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                      <div className="flex flex-1 flex-col text-center">
                        <h4 className="mb-2 text-xl font-bold text-gray-800">Anual Básico</h4>
                        <p className="mb-4 text-sm text-gray-600">Acesso completo com desconto</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-blue-600">R$ 79,90</span>
                          <span className="text-gray-500">/mês</span>
                          <div className="text-sm text-gray-500">(R$ 958,80/ano)</div>
                        </div>
                        <div className="mt-auto">
                          <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                            onClick={() => handleSubscriptionCheckout('anual-basico')}
                            disabled={loadingPurchase === 'anual-basico'}
                          >
                            {loadingPurchase === 'anual-basico' ? 'Processando...' : 'Assinar Plano'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Plano Mensal Plus */}
                    <div className="flex flex-col rounded-xl border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-lg">
                      <div className="flex flex-1 flex-col text-center">
                        <h4 className="mb-2 text-xl font-bold text-gray-800">Mensal Plus</h4>
                        <p className="mb-4 text-sm text-gray-600">
                          Acesso completo + explicações práticas
                        </p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-purple-600">R$ 119,90</span>
                          <span className="text-gray-500">/mês</span>
                        </div>
                        <div className="mt-auto">
                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                            onClick={() => handleSubscriptionCheckout('mensal-plus')}
                            disabled={loadingPurchase === 'mensal-plus'}
                          >
                            {loadingPurchase === 'mensal-plus' ? 'Processando...' : 'Assinar Plano'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Plano Anual Plus */}
                    <div className="flex flex-col rounded-xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                      <div className="flex flex-1 flex-col text-center">
                        <h4 className="mb-2 text-xl font-bold text-gray-800">Anual Plus</h4>
                        <p className="mb-4 text-sm text-gray-600">
                          Acesso completo + explicações com desconto
                        </p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-purple-600">R$ 89,90</span>
                          <span className="text-gray-500">/mês</span>
                          <div className="text-sm text-gray-500">(R$ 1.078,80/ano)</div>
                        </div>
                        <div className="mt-auto">
                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                            onClick={() => handleSubscriptionCheckout('anual-plus')}
                            disabled={loadingPurchase === 'anual-plus'}
                          >
                            {loadingPurchase === 'anual-plus' ? 'Processando...' : 'Assinar Plano'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Se tem acesso, mostra os livros
              <>
                <div className="mb-8 text-center">
                  <h1 className="mb-4 text-4xl font-bold text-gray-800">Bem-vindo à Biblioteca!</h1>
                  <p className="text-lg text-gray-600">
                    Você tem acesso aos livros de Halachá. Escolha um livro para começar.
                  </p>
                </div>

                {/* Grid de Livros */}
                <div className="mx-auto max-w-6xl">
                  <div className="grid grid-cols-1 place-items-center gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Livro FAQ */}
                    <Link
                      href="/dashboard/faq"
                      className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      {/* Header com gradiente amarelo */}
                      <div className="h-32 bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
                        <div className="flex items-center justify-between">
                          <div className="rounded-full bg-white/20 p-3">
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
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="rounded-full bg-yellow-500 p-2">
                            <svg
                              className="h-4 w-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do card */}
                      <div className="p-6">
                        <h3 className="mb-2 text-xl font-bold text-gray-800">
                          Perguntas Mais Frequentes
                        </h3>
                        <p className="mb-4 text-sm text-gray-600">
                          Conceitos fundamentais do Judaísmo - comece por aqui
                        </p>

                        {/* Badge especial */}
                        <div className="mb-4">
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                            <svg
                              className="mr-1 h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Comece por aqui
                          </span>
                        </div>

                        {/* Botão de ação */}
                        <div className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-3 text-center font-semibold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
                          Ver Perguntas Frequentes
                        </div>
                      </div>
                    </Link>

                    {/* Livro Shulchan Aruch */}
                    <Link
                      href="/dashboard/biblioteca/shulchan-aruch"
                      className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      {/* Header com gradiente azul */}
                      <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                        <div className="flex items-center justify-between">
                          <div className="rounded-full bg-white/20 p-3">
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
                          <div className="rounded-full bg-green-500 p-1">
                            <svg
                              className="h-4 w-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do card */}
                      <div className="p-6">
                        <h3 className="mb-2 text-xl font-bold text-gray-800">Shulchan Aruch</h3>
                        <p className="mb-4 text-sm text-gray-600">
                          por R. Yosef Karo - O código completo da Halachá
                        </p>

                        {/* Badges de recursos */}
                        <div className="mb-4 flex flex-wrap gap-2">
                          <DynamicAccessBadge
                            accessInfo={userAccessInfo}
                            fallbackText="Acesso Completo"
                          />
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

                        {/* Botão de ação */}
                        <div className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-center font-semibold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
                          Acessar Shulchan Aruch
                        </div>
                      </div>
                    </Link>

                    {/* Card de Upgrade para Assinatura - só aparece se tem tratados avulsos */}
                    {userAccessInfo?.purchasedDivisions && userAccessInfo.purchasedDivisions.length > 0 && !userAccessInfo?.hasActiveSubscription && (
                      <div className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border-2 border-green-200">
                        {/* Header com gradiente verde */}
                        <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-500 p-6">
                          <div className="flex items-center justify-between">
                            <div className="rounded-full bg-white/20 p-3">
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
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                            </div>
                            <div className="rounded-full bg-yellow-400 p-1">
                              <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo do card */}
                        <div className="p-6">
                          <h3 className="mb-2 text-xl font-bold text-gray-800">✨ Upgrade para Assinatura</h3>
                          <p className="mb-4 text-sm text-gray-600">
                            Você tem tratados avulsos. Faça upgrade para acessar toda a biblioteca!
                          </p>

                          {/* Benefícios */}
                          <div className="mb-4 space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Acesso a todos os livros
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Economia significativa
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Recursos exclusivos
                            </div>
                          </div>

                          {/* Botão de ação */}
                          <Link href="/planos">
                            <div className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-center font-semibold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
                              Ver Planos de Assinatura
                            </div>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal de seleção de tratados */}
      <TreatiseSelectionModal
        isOpen={showTreatiseModal}
        onClose={() => setShowTreatiseModal(false)}
        onSelect={handleTreatiseSelection}
        loading={loadingPurchase === 'tratado-avulso'}
      />
    </DashboardAccessGuard>
  )
}
