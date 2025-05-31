'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface BookAccessGuardProps {
  children: React.ReactNode
  bookId: string
}

export function BookAccessGuard({ children, bookId }: BookAccessGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState<boolean>(false)

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        // Primeiro, verifica assinatura ativa
        const { data: assinatura } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        const assinaturaAtiva = assinatura && new Date(assinatura.current_period_end) > new Date()
        if (assinaturaAtiva) {
          setHasAccess(true)
          return
        }
        // Só consulta purchased_books se NÃO tiver assinatura ativa
        const { data: purchasedBook } = await supabase
          .from('purchased_books')
          .select('expires_at')
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .single()
        const hasPurchasedBook = purchasedBook && new Date(purchasedBook.expires_at) > new Date()
        setHasAccess(Boolean(hasPurchasedBook))
      } catch (err) {
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [user, bookId])

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

  if (!hasAccess) {
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
              Você precisa ter uma assinatura ativa ou comprar este livro para acessar seu conteúdo.
            </p>
            <div className="flex gap-4">
              <Button className="w-full" onClick={() => router.push('/planos')}>
                Ver Planos
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/livros')}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
