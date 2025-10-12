'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Lock, ShoppingCart, Home } from 'lucide-react'
import Link from 'next/link'

interface DivisionAccessGuardProps {
  children: React.ReactNode
  divisionId: string
  fallbackHref?: string
  fallbackLabel?: string
}

export function DivisionAccessGuard({
  children,
  divisionId,
  fallbackHref = '/dashboard',
  fallbackLabel = 'Voltar para Dashboard',
}: DivisionAccessGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { loading, hasAccess, canAccessDivision } = useSubscription()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Verificando acesso...</p>
        </div>
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
              Faça login para acessar este conteúdo.
            </p>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess && !canAccessDivision(divisionId)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 p-4">
            <svg
              className="h-8 w-8 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Acesso Restrito</h2>
          <p className="mb-6 text-gray-600">
            Você não tem acesso a este tratado. Adquira uma assinatura completa ou compre este
            tratado específico.
          </p>
          <div className="space-y-3">
            <Link
              href={`/payment?divisionId=${divisionId}`}
              className="inline-block flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-center font-medium text-white hover:bg-green-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Comprar Este Tratado
            </Link>
            <Link
              href="/dashboard"
              className="inline-block flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700"
            >
              <Home className="h-4 w-4" />
              Ver Planos Completos
            </Link>
            <Link
              href={fallbackHref}
              className="inline-block w-full rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 hover:border-gray-400"
            >
              {fallbackLabel}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
