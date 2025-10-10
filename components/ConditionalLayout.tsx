'use client'

import { useAuth } from '@/contexts/auth-context'
import { DashboardHeader, HeaderSimplificado } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'
import { Footer } from '@/components/Footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {user ? <DashboardHeader /> : <HeaderSimplificado />}
      <main className="flex-1">{children}</main>
      {user ? <DashboardFooter /> : <Footer />}
    </div>
  )
}
