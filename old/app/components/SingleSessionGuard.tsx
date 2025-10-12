import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SingleSessionGuard({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    const checkSession = async () => {
      const localSessionId = localStorage.getItem('session_id')
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('current_session_id')
        .eq('id', user.id)
        .single()
      if (data?.current_session_id && data.current_session_id !== localSessionId) {
        await signOut()
        router.push('/login')
      }
    }
    checkSession()
  }, [user, signOut, router])

  return <>{children}</>
}
