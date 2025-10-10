'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetError?: () => void
  retryCount?: number
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  retryCount: number
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retryCount = 0,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 p-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Oops! Algo deu errado</h2>
        <p className="mb-6 text-gray-600">
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 rounded bg-gray-100 p-3 text-left text-sm">
            <summary className="cursor-pointer font-medium">Detalhes do erro</summary>
            <pre className="mt-2 overflow-auto text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <div className="space-y-3">
          {resetError && (
            <Button
              onClick={resetError}
              className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          <Link href="/dashboard">
            <Button variant="outline" className="flex w-full items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
        {retryCount > 0 && <p className="mt-4 text-sm text-gray-500">Tentativas: {retryCount}</p>}
      </div>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      retryCount: 0,
    }
  }

  componentDidCatch() {
    // Log do erro para monitoramento
    // Aqui você pode integrar com serviços de monitoramento como Sentry
    // Sentry.captureException(error, { extra: errorInfo })
  }

  resetError = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }))
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          retryCount={this.state.retryCount}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Componente de erro simples para uso em páginas
 */
interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  retryCount?: number
  showBackButton?: boolean
  backHref?: string
  backLabel?: string
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Erro ao Carregar Conteúdo',
  message,
  onRetry,
  retryCount = 0,
  showBackButton = true,
  backHref = '/dashboard',
  backLabel = 'Voltar',
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 p-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-gray-800">{title}</h2>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="space-y-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="outline" className="w-full">
                {backLabel}
              </Button>
            </Link>
          )}
        </div>
        {retryCount > 0 && <p className="mt-4 text-sm text-gray-500">Tentativas: {retryCount}</p>}
      </div>
    </div>
  )
}
