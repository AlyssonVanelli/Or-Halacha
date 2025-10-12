import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

interface AccessInfo {
  totalDivisions: number
  accessibleDivisions: number
  hasAllAccess: boolean
  hasActiveSubscription: boolean
  purchasedDivisions: string[]
}

export function useAccessInfo(bookId?: string) {
  const { user } = useAuth()
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAccessInfo() {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Buscar divisões do livro
        let divisionsQuery = supabase.from('divisions').select('id')

        if (bookId) {
          divisionsQuery = divisionsQuery.eq('book_id', bookId)
        }

        const { data: divisionsData, error: divisionsError } = await divisionsQuery

        if (divisionsError) {
          throw new Error('Erro ao carregar divisões')
        }

        const totalDivisions = divisionsData?.length || 0

        // Verificar assinatura ativa
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        const hasActiveSubscription =
          !!subscriptionData &&
          subscriptionData.status === 'active' &&
          (subscriptionData.current_period_end
            ? new Date(subscriptionData.current_period_end) > new Date()
            : true) // Se não tem data de fim, considera ativa

        console.log('useAccessInfo - Verificação de assinatura:')
        console.log('- Subscription data:', subscriptionData)
        console.log('- Has active subscription:', hasActiveSubscription)

        // Buscar divisões compradas
        const { data: purchasedData, error: purchasedError } = await supabase
          .from('purchased_books')
          .select('division_id, expires_at')
          .eq('user_id', user.id)

        const validPurchases = (purchasedData || []).filter(
          pb => new Date(pb.expires_at) > new Date()
        )

        const purchasedDivisions = validPurchases.map(pb => pb.division_id)
        const accessibleDivisions = hasActiveSubscription ? totalDivisions : validPurchases.length
        const hasAllAccess = hasActiveSubscription || accessibleDivisions === totalDivisions

        setAccessInfo({
          totalDivisions,
          accessibleDivisions,
          hasAllAccess,
          hasActiveSubscription,
          purchasedDivisions,
        })
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    loadAccessInfo()
  }, [user, bookId])

  return {
    accessInfo,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      setError(null)
    },
  }
}
