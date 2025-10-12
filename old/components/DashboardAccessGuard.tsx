'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface DashboardAccessGuardProps {
  children: React.ReactNode
}

export function DashboardAccessGuard({ children }: DashboardAccessGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center">
            <Lock className="mb-2 h-12 w-12 text-blue-700 dark:text-blue-400" />
            <span className="text-2xl font-bold text-slate-800 dark:text-white">
              Acesso Restrito
            </span>
          </div>
          <div className="rounded-2xl border-0 bg-white/90 p-8 text-center shadow-xl dark:bg-slate-950/90">
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Faça login para acessar o dashboard.
            </p>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
