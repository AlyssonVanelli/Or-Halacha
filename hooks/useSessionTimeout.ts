import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

// Configuração de expiração de sessão (30 minutos para teste)
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutos em ms

export function useSessionTimeout() {
  const { user } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!user) return
    
    const checkSessionTimeout = () => {
      const sessionStart = localStorage.getItem('session_start')
      const now = Date.now()
      
      if (sessionStart && (now - parseInt(sessionStart)) > SESSION_DURATION) {
        console.log('🕐 Sessão expirou por tempo limite (30 minutos) - redirecionando para login')
        localStorage.removeItem('session_start')
        router.push('/login?message=session-expired')
      }
    }
    
    // Verificar a cada minuto
    const interval = setInterval(checkSessionTimeout, 60000)
    
    return () => clearInterval(interval)
  }, [user, router])
}
