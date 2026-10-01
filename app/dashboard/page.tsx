'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
import { DynamicAccessBadge } from '@/components/AccessBadge'
import { useAccessInfo } from '@/hooks/useAccessInfo'
import Link from 'next/link'
import { PlanCards } from '@/components/PlanCards'
import { SimanDoDia, type SimanDoDiaData } from '@/app/components/siman-do-dia'
import { Glossary } from '@/components/content/Glossary'

export default function DashboardPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [hasPlusFeatures, setHasPlusFeatures] = useState(false)

  // Hook para informações de acesso do Shulchan Aruch
  const { accessInfo: userAccessInfo } = useAccessInfo()
  const [hasAnyAccess, setHasAnyAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Siman gratuito do dia (mostrado para quem ainda não tem plano)
  const [simanDoDia, setSimanDoDia] = useState<SimanDoDiaData | null>(null)
  useEffect(() => {
    fetch('/api/siman-do-dia')
      .then(res => (res.ok ? res.json() : null))
      .then(setSimanDoDia)
      .catch(() => setSimanDoDia(null))
  }, [])

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
              // Sem plano: começa pelo conteúdo gratuito e depois mostra os planos
              <>
                <section className="mx-auto mb-12 max-w-6xl" aria-labelledby="comece-gratis">
                  <h1
                    id="comece-gratis"
                    className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl"
                  >
                    Bem-vindo! Comece grátis
                  </h1>
                  <p className="mb-6 max-w-3xl text-lg text-gray-600">
                    Leia o siman do dia completo, navegue pelos índices dos 4 tratados e leia o
                    primeiro seif de qualquer siman. Quando quiser ir além, escolha um plano.
                  </p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <SimanDoDia siman={simanDoDia} />
                    <div className="flex flex-col gap-4">
                      <Link
                        href="/dashboard/biblioteca/shulchan-aruch"
                        className="rounded-2xl bg-white p-6 shadow-lg transition hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <h2 className="text-xl font-bold text-gray-900">Explorar a biblioteca</h2>
                        <p className="mt-1 text-gray-600">
                          Os 4 tratados do Shulchan Aruch, com o assunto de cada siman e busca por
                          tema.
                        </p>
                        <span className="mt-3 inline-block font-semibold text-blue-700">
                          Abrir biblioteca →
                        </span>
                      </Link>
                      <Link
                        href="/dashboard/faq"
                        className="rounded-2xl bg-white p-6 shadow-lg transition hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <h2 className="text-xl font-bold text-gray-900">Perguntas frequentes</h2>
                        <p className="mt-1 text-gray-600">
                          Conceitos básicos do judaísmo para quem está começando.
                        </p>
                        <span className="mt-3 inline-block font-semibold text-blue-700">
                          Ver perguntas →
                        </span>
                      </Link>
                      <Glossary />
                    </div>
                  </div>
                </section>

                <div className="mb-8 text-center">
                  <h2 className="mb-4 text-3xl font-bold text-gray-800">Escolha seu plano</h2>
                  <p className="text-lg text-gray-600">
                    Leitura completa dos 4 tratados, busca e favoritos. No Plus, explicações
                    práticas em mais de 11 mil seifim.
                  </p>
                </div>

                <PlanCards />
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

                {simanDoDia && (
                  <div className="mx-auto mb-10 max-w-xl">
                    <SimanDoDia siman={simanDoDia} />
                  </div>
                )}

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
                    {userAccessInfo?.purchasedDivisions &&
                      userAccessInfo.purchasedDivisions.length > 0 &&
                      !userAccessInfo?.hasActiveSubscription && (
                        <div className="group relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
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
                            <h3 className="mb-2 text-xl font-bold text-gray-800">
                              ✨ Upgrade para Assinatura
                            </h3>
                            <p className="mb-4 text-sm text-gray-600">
                              Você tem tratados avulsos. Faça upgrade para acessar toda a
                              biblioteca!
                            </p>

                            {/* Benefícios */}
                            <div className="mb-4 space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <svg
                                  className="mr-2 h-4 w-4 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Acesso a todos os livros
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg
                                  className="mr-2 h-4 w-4 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Economia significativa
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg
                                  className="mr-2 h-4 w-4 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
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
    </DashboardAccessGuard>
  )
}
