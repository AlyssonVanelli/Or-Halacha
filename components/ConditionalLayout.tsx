'use client'

import { useAuth } from '@/contexts/auth-context'
import { DashboardHeader, HeaderSimplificado } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'
import { Footer } from '@/components/Footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

// Renderiza o conteúdo mesmo enquanto o login é verificado (o Google precisa ver a página);
// o header/rodapé de usuário logado aparece assim que a sessão é confirmada.
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {user ? <DashboardHeader /> : <HeaderSimplificado />}
      <main className="flex-1">{children}</main>
      {user ? <DashboardFooter /> : <Footer />}
    </div>
  )
}
