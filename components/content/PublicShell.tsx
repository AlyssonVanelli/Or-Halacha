'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardHeader, HeaderSimplificado } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'

// Páginas de leitura públicas: header do painel para quem está logado, header do site para visitantes.
export function PublicShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {user ? <DashboardHeader /> : <HeaderSimplificado />}
      <main className="flex-1">{children}</main>
      <DashboardFooter />
    </div>
  )
}
