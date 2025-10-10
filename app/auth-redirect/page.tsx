'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function AuthRedirectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('User authenticated, redirecting to dashboard...')
        // Aguardar um pouco mais para garantir que tudo esteja sincronizado
        setTimeout(() => {
          router.replace('/dashboard')
        }, 200)
      } else {
        console.log('User not authenticated, redirecting to login...')
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-gray-600">Verificando autenticação...</p>
      </div>
    </div>
  )
}
