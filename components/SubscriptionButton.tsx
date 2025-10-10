'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SubscriptionButtonProps {
  planType: string
  children: React.ReactNode
  className?: string
}

export function SubscriptionButton({ planType, children, className }: SubscriptionButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!user) {
      // Se não estiver logado, vai para signup
      router.push(`/signup?plan=${planType}`)
      return
    }

    // Se estiver logado, vai direto para checkout
    setLoading(true)
    try {
      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/dashboard`,
        }),
      })
      
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      // Fallback para signup se der erro
      router.push(`/signup?plan=${planType}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Processando...' : children}
    </Button>
  )
}
