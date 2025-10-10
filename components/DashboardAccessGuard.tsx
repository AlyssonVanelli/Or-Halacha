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
      <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-3xl font-bold text-transparent">
              Acesso Restrito
            </span>
          </div>
          <div className="rounded-2xl border-0 bg-gradient-to-br from-white to-blue-50/30 p-8 text-center shadow-xl transition-all duration-300 hover:shadow-2xl">
            <p className="mb-8 text-lg text-gray-600">Faça login para acessar o dashboard.</p>
            <Button
              className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
              onClick={() => router.push('/login')}
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
