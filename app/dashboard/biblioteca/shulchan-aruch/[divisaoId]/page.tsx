'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
import { DivisionAccessGuard } from '@/components/DivisionAccessGuard'
import { ErrorDisplay } from '@/components/ErrorBoundary'
import { ScreenCaptureProtection } from '@/components/ScreenCaptureProtection'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Book, Grid3X3, List } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { parseSimanContent } from '@/lib/content-parser'

interface Siman {
  id: string
  title: string
  position: number
  topics?: string[]
  summary?: string
}

interface Division {
  id: string
  title: string
  description: string | null
  book_id: string
}

export default function DivisaoPage() {
  const { user } = useAuth()
  const params = useParams()
  const divisaoId = params.divisaoId as string
  const [division, setDivision] = useState<Division | null>(null)
  const [simanim, setSimanim] = useState<Siman[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const errorHandler = useErrorHandler()

  useEffect(() => {
    async function loadData() {
      if (!user || !divisaoId) return

      setLoading(true)
      errorHandler.clearError()

      try {
        const supabase = createClient()

        // Carregar divisão
        const { data: divisionData, error: divisionError } = await supabase
          .from('divisions')
          .select('*')
          .eq('id', divisaoId)
          .single()

        if (divisionError) {
          errorHandler.handleError('Carregamento da divisão', divisionError, {
            divisaoId,
            userId: user.id,
          })
          return
        }

        if (!divisionData) {
          errorHandler.setError('Divisão não encontrada. Verifique se o link está correto.')
          return
        }

        setDivision(divisionData)

        // Carregar simanim (chapters)
        const { data: simanimData, error: simanimError } = await supabase
          .from('chapters')
          .select('id, title, position')
          .eq('division_id', divisaoId)
          .order('position')

        if (simanimError) {
          errorHandler.handleError('Carregamento dos simanim', simanimError, {
            divisaoId,
            userId: user.id,
            divisionTitle: divisionData?.title,
          })
          return
        }

        // Validar dados dos simanim
        if (!simanimData || !Array.isArray(simanimData)) {
          errorHandler.handleError('Dados inválidos dos simanim', { simanimData }, { divisaoId })
          return
        }

        // Carregar conteúdo e extrair assuntos para cada siman
        const simanimWithTopics = await Promise.all(
          simanimData.map(async (siman) => {
            try {
              // Buscar conteúdo do siman
              const { data: contentData } = await supabase
                .from('content')
                .select('content')
                .eq('chapter_id', siman.id)
                .single()

              if (contentData?.content) {
                // Extrair assuntos usando o parser
                const parsedContent = parseSimanContent(
                  siman.id,
                  siman.title,
                  siman.position,
                  contentData.content
                )
                
                return {
                  ...siman,
                  topics: parsedContent.topics || [],
                  summary: parsedContent.summary || ''
                }
              }
              
              return siman
            } catch (error) {
              console.error(`Erro ao extrair assuntos do siman ${siman.id}:`, error)
              return siman
            }
          })
        )

        setSimanim(simanimWithTopics)

        // Verificar acesso ESPECÍFICO para esta divisão
        try {
          const accessResponse = await fetch('/api/check-division-access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              divisionId: divisaoId,
            }),
          })

          if (!accessResponse.ok) {
            throw new Error(`Erro na verificação de acesso: ${accessResponse.status}`)
          }

          const accessData = await accessResponse.json()

          if (!accessData.success) {
            throw new Error('Falha na verificação de acesso')
          }

          const { hasAccess } = accessData.access

          setHasAccess(hasAccess)
        } catch (accessError) {
          errorHandler.handleError('Verificação de acesso', accessError, {
            divisaoId,
            userId: user.id,
          })
          // Fallback para verificação local se a API falhar
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle()

          const { data: purchasedData } = await supabase
            .from('purchased_books')
            .select('division_id, expires_at')
            .eq('user_id', user.id)

          const hasActiveSub =
            !!subscriptionData &&
            subscriptionData.status === 'active' &&
            (subscriptionData.current_period_end
              ? new Date(subscriptionData.current_period_end) > new Date()
              : true) // Se não tem data de fim, considera ativa
          const validPurchases = (purchasedData || []).filter(
            pb => new Date(pb.expires_at) > new Date()
          )
          const hasPurchasedThisDivision = validPurchases.some(pb => pb.division_id === divisaoId)

          setHasAccess(hasActiveSub || hasPurchasedThisDivision)
        }
      } catch (error) {
        errorHandler.handleError('Erro inesperado no carregamento', error, {
          divisaoId,
          userId: user.id,
          retryCount: errorHandler.retryCount,
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, divisaoId])

  const handleRetry = () => {
    errorHandler.incrementRetry()
  }

  if (loading) {
    return (
      <DashboardAccessGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-lg text-gray-600">Carregando conteúdo...</p>
          </div>
        </div>
      </DashboardAccessGuard>
    )
  }

  if (errorHandler.error) {
    return (
      <DashboardAccessGuard>
        <ErrorDisplay
          message={errorHandler.error}
          onRetry={handleRetry}
          retryCount={errorHandler.retryCount}
          backHref="/dashboard"
          backLabel="Voltar para Dashboard"
        />
      </DashboardAccessGuard>
    )
  }

  if (!hasAccess) {
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
      <DivisionAccessGuard divisionId={divisaoId}>
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
          <main className="flex-1">
            <div className="container py-8">
              {/* Header */}
              <div className="mb-8">
                <Link
                  href="/dashboard/biblioteca/shulchan-aruch"
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
                    <h1 className="text-4xl font-bold text-gray-800">{division?.title}</h1>
                    {division?.description && (
                      <p className="mt-2 text-lg text-gray-600">{division.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de Simanim */}
              <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                  <h2 className="mb-4 text-3xl font-bold text-gray-800">Simanim</h2>
                  <p className="mb-6 text-lg text-gray-600">Selecione um siman para estudar</p>
                  
                  {/* Toggle de Visualização */}
                  <div className="flex justify-center">
                    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                        Cards
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          viewMode === 'list'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <List className="h-4 w-4" />
                        Lista
                      </button>
                    </div>
                  </div>
                </div>

                {simanim.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 p-4">
                      <Book className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-600">
                      Nenhum Siman Encontrado
                    </h3>
                    <p className="mb-6 text-gray-500">
                      Esta divisão ainda não possui simanim disponíveis.
                    </p>
                    <Link href="/dashboard">
                      <Button variant="outline">Voltar para Dashboard</Button>
                    </Link>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 place-items-center gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {simanim.map((siman, index) => {
                      const colors = [
                        'from-blue-500 to-blue-600',
                        'from-green-500 to-green-600',
                        'from-purple-500 to-purple-600',
                        'from-orange-500 to-orange-600',
                        'from-red-500 to-red-600',
                        'from-indigo-500 to-indigo-600',
                        'from-pink-500 to-pink-600',
                        'from-teal-500 to-teal-600',
                      ]

                      return (
                        <Link
                          key={siman.id}
                          href={`/dashboard/biblioteca/shulchan-aruch/${divisaoId}/siman/${siman.id}`}
                          className="group relative w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                        >
                          {/* Header com gradiente */}
                          <div
                            className={`h-20 bg-gradient-to-r ${colors[index % colors.length]} p-4`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="rounded-full bg-white/20 p-2">
                                <Book className="h-5 w-5 text-white" />
                              </div>
                              <div className="text-lg font-bold text-white">{siman.position}</div>
                            </div>
                          </div>

                          {/* Conteúdo do card */}
                          <div className="p-4">
                            {/* Resumo limpo do Siman */}
                            {siman.summary && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-600 line-clamp-3">
                                  {siman.summary.replace(/^SIMAN\s+\d+\s*/i, '').trim()}
                                </p>
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {simanim.map((siman, index) => (
                      <Link
                        key={siman.id}
                        href={`/dashboard/biblioteca/shulchan-aruch/${divisaoId}/siman/${siman.id}`}
                        className="group flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        {/* Número do Siman */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
                          {siman.position}
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1">
                          <h3 className="mb-1 text-lg font-semibold text-gray-800">
                            {siman.title}
                          </h3>
                          {siman.summary && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {siman.summary.replace(/^SIMAN\s+\d+\s*/i, '').trim()}
                            </p>
                          )}
                        </div>
                        
                        {/* Ícone de seta */}
                        <div className="text-gray-400 group-hover:text-blue-500">
                          <ArrowLeft className="h-5 w-5 rotate-180" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </DivisionAccessGuard>
    </DashboardAccessGuard>
  )
}
