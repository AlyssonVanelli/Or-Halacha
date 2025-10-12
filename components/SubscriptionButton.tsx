'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PLAN_TYPES } from '@/lib/stripe'

interface SubscriptionButtonProps {
  planType: string
  children: React.ReactNode
  className?: string
  divisionId?: string // Para compras avulsas
  metadata?: Record<string, string>
}

export function SubscriptionButton({
  planType,
  children,
  className,
  divisionId,
  metadata = {},
}: SubscriptionButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!user) {
      // Se não estiver logado, vai para signup
      const params = new URLSearchParams({ plan: planType })
      if (divisionId) params.set('divisionId', divisionId)
      router.push(`/signup?${params.toString()}`)
      return
    }

    // Se estiver logado, vai direto para checkout
    setLoading(true)
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/dashboard`,
          divisionId,
          metadata,
        }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erro ao criar checkout')
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      // Fallback para signup se der erro
      const params = new URLSearchParams({ plan: planType })
      if (divisionId) params.set('divisionId', divisionId)
      router.push(`/signup?${params.toString()}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Processando...' : children}
    </Button>
  )
}
