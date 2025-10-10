'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ErrorDisplay } from '@/components/ErrorBoundary'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ShoppingCart, Home } from 'lucide-react'
import Link from 'next/link'

interface DivisionAccessGuardProps {
  children: React.ReactNode
  divisionId: string
  fallbackHref?: string
  fallbackLabel?: string
}

export function DivisionAccessGuard({ 
  children, 
  divisionId, 
  fallbackHref = "/dashboard/biblioteca",
  fallbackLabel = "Voltar para Biblioteca"
}: DivisionAccessGuardProps) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const errorHandler = useErrorHandler()

  useEffect(() => {
    async function checkAccess() {
      if (!user || !divisionId) {
        setLoading(false)
        return
      }

      setLoading(true)
      errorHandler.clearError()

      try {
        const response = await fetch('/api/check-division-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: user.id, 
            divisionId 
          }),
        })

        if (!response.ok) {
          throw new Error(`Erro na verificação de acesso: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error('Falha na verificação de acesso')
        }

        setHasAccess(data.access.hasAccess)


      } catch (error) {
        errorHandler.handleError('Verificação de acesso à divisão', error, { 
          divisionId, 
          userId: user.id 
        })
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [user, divisionId, errorHandler.retryCount])

  const handleRetry = () => {
    errorHandler.incrementRetry()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (errorHandler.error) {
    return (
      <ErrorDisplay
        title="Erro na Verificação de Acesso"
        message={errorHandler.error}
        onRetry={handleRetry}
        retryCount={errorHandler.retryCount}
        backHref={fallbackHref}
        backLabel={fallbackLabel}
      />
    )
  }

  if (hasAccess === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="rounded-full bg-orange-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 mb-6">
            Você não tem acesso a este tratado. Adquira uma assinatura completa ou compre este tratado específico.
          </p>
          <div className="space-y-3">
            <Link 
              href={`/payment?divisionId=${divisionId}`}
              className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Comprar Este Tratado
            </Link>
            <Link 
              href="/dashboard"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ver Planos Completos
            </Link>
            <Link 
              href={fallbackHref}
              className="inline-block w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg text-center"
            >
              {fallbackLabel}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (hasAccess === true) {
    return <>{children}</>
  }

  // Estado de loading ou erro
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}
