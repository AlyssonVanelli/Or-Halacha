'use client'

import type React from 'react'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || ''

  useEffect(() => {
    // Não redireciona se estiver na página de busca ou se ainda está carregando
    if (!user && !pathname.startsWith('/search')) {
      // Pequeno delay para evitar redirecionamento prematuro
      const timer = setTimeout(() => {
        router.push('/login')
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [user, router, pathname])

  if (!user && !pathname.startsWith('/search')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader />
      <main className="flex-1">{children}</main>
      <DashboardFooter />
    </div>
  )
}
