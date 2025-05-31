import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

interface SubscriberGuardProps {
  children: React.ReactNode
}

export default function SubscriberGuard({ children }: SubscriberGuardProps) {
  const { user } = useAuth()
  const [isSubscriber, setIsSubscriber] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
        .then(({ data }) => {
          setIsSubscriber(!!data)
        })
    } else if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (isSubscriber === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isSubscriber) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h2 className="mb-4 text-xl font-bold">Acesso restrito</h2>
        <p>
          Este conteúdo é exclusivo para assinantes.{' '}
          <a href="/assinatura" className="text-blue-600 underline">
            Assine agora
          </a>
        </p>
      </div>
    )
  }

  return <>{children}</>
}
