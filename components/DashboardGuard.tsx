import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { db } from '@/lib/db'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardGuardProps {
  children: React.ReactNode
}

export default function DashboardGuard({ children }: DashboardGuardProps) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAccess() {
      if (user) {
        try {
          // Verifica se é admin
          const supabase = createClient()
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

          if (profile?.is_admin) {
            setHasAccess(true)
            return
          }

          // Verifica se tem assinatura ativa
          const subscription = await db.subscriptions.getActiveByUserId(user.id)
          if (subscription) {
            setHasAccess(true)
            return
          }

          // Se não for admin e não tiver assinatura, redireciona para planos
          setHasAccess(false)
          router.push('/planos?erro=acesso')
        } catch (error) {
          setHasAccess(false)
        }
      } else if (!user) {
        router.push('/login')
      }
    }

    checkAccess()
  }, [user, router])

  if (hasAccess === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
              Este conteúdo é exclusivo para assinantes.
            </p>
            <Button className="w-full" onClick={() => router.push('/planos')}>
              Ver Planos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
