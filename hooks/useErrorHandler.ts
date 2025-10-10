import { useState, useCallback } from 'react'
import { translateDataError, logDetailedError } from '@/lib/error-translations'

interface ErrorState {
  error: string | null
  retryCount: number
}

interface UseErrorHandlerReturn {
  error: string | null
  retryCount: number
  setError: (error: string | null) => void
  handleError: (context: string, error: any, additionalData?: any) => void
  clearError: () => void
  incrementRetry: () => void
  resetRetry: () => void
}

/**
 * Hook personalizado para tratamento de erros
 * Fornece funcionalidades centralizadas para logging, tradução e retry
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    retryCount: 0,
  })

  const setError = useCallback((error: string | null) => {
    setErrorState(prev => ({ ...prev, error }))
  }, [])

  const handleError = useCallback((context: string, error: any, additionalData?: any) => {
    logDetailedError(context, error, additionalData)
    const translatedError = translateDataError(error)
    setError(translatedError)
  }, [])

  const clearError = useCallback(() => {
    setErrorState(prev => ({ ...prev, error: null }))
  }, [])

  const incrementRetry = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null,
    }))
  }, [])

  const resetRetry = useCallback(() => {
    setErrorState(prev => ({ ...prev, retryCount: 0 }))
  }, [])

  return {
    error: errorState.error,
    retryCount: errorState.retryCount,
    setError,
    handleError,
    clearError,
    incrementRetry,
    resetRetry,
  }
}

/**
 * Hook para operações assíncronas com tratamento de erro
 */
export function useAsyncOperation<T = any>() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const errorHandler = useErrorHandler()

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      context: string,
      additionalData?: any
    ): Promise<T | null> => {
      setLoading(true)
      errorHandler.clearError()

      try {
        const result = await operation()
        setData(result)
        return result
      } catch (error) {
        errorHandler.handleError(context, error, additionalData)
        return null
      } finally {
        setLoading(false)
      }
    },
    [errorHandler]
  )

  const reset = useCallback(() => {
    setData(null)
    errorHandler.clearError()
    errorHandler.resetRetry()
  }, [errorHandler])

  return {
    loading,
    data,
    error: errorHandler.error,
    retryCount: errorHandler.retryCount,
    execute,
    reset,
    handleRetry: errorHandler.incrementRetry,
  }
}
