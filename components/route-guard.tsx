'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (user) {
      setAuthorized(true)
    } else {
      router.push('/login')
    }
  }, [user, router])

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Se não estiver autorizado, não renderizar nada (o redirecionamento já foi iniciado)
  if (!authorized) {
    return null
  }

  // Se estiver autorizado, renderizar os filhos
  return <>{children}</>
}
