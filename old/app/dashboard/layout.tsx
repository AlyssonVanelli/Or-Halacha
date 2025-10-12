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
    // Não redireciona se estiver na página de busca
    if (!user && !pathname.startsWith('/search')) {
      router.push('/login')
    }
  }, [user, router, pathname])

  if (!user && !pathname.startsWith('/search')) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main>{children}</main>
      <DashboardFooter />
    </div>
  )
}
