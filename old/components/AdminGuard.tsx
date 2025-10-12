import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const supabase = createClient()
      supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setIsAdmin(false)
          } else {
            setIsAdmin(data?.is_admin === true)
          }
          setLoading(false)
        })
    } else if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h2 className="mb-4 text-xl font-bold">Acesso restrito</h2>
        <p>Esta área é exclusiva para administradores.</p>
      </div>
    )
  }

  return <>{children}</>
}
