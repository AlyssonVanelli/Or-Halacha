'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { accessService, AccessInfo } from '@/lib/services/access-service'

interface UseSubscriptionReturn {
  accessInfo: AccessInfo | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  hasAccess: boolean
  hasPlusAccess: boolean
  canAccessDivision: (divisionId: string) => boolean
  canAccessBook: (bookId: string) => boolean
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccessInfo = async () => {
    if (!user) {
      setAccessInfo(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const info = await accessService.getUserAccess(user.id)
      setAccessInfo(info)
    } catch (err) {
      console.error('Erro ao buscar informações de acesso:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessInfo()
  }, [user])

  const refresh = async () => {
    await fetchAccessInfo()
  }

  const hasAccess = accessInfo?.hasAccess ?? false
  const hasPlusAccess = accessInfo?.subscriptionInfo?.isPlus ?? false

  const canAccessDivision = (divisionId: string): boolean => {
    if (!accessInfo) return false
    return accessInfo.canAccessDivision(divisionId)
  }

  const canAccessBook = (bookId: string): boolean => {
    if (!accessInfo) return false
    return accessInfo.canAccessBook(bookId)
  }

  return {
    accessInfo,
    loading,
    error,
    refresh,
    hasAccess,
    hasPlusAccess,
    canAccessDivision,
    canAccessBook,
  }
}
