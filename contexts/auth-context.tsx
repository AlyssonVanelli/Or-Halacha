'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { translateAuthError } from '@/lib/error-translations'

interface AuthContextType {
  user: User | null
  loading: boolean
  syncing: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const pathname = usePathname()

  // Configuração de expiração de sessão (30 minutos para teste)
  const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 horas em ms

  // Função para verificar se a sessão expirou
  const checkSessionExpiry = async (supabase: any) => {
    const sessionStart = localStorage.getItem('session_start')
    const now = Date.now()

    if (sessionStart && now - parseInt(sessionStart) > SESSION_DURATION) {
      await supabase.auth.signOut()
      localStorage.removeItem('session_start')
      return true // Sessão expirou
    }
    return false // Sessão ainda válida
  }

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function syncUser() {
      try {
        setSyncing(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (session?.user) {
            // Verificar se a sessão expirou por tempo limite
            const sessionExpired = await checkSessionExpiry(supabase)
            if (sessionExpired) {
              setUser(null)
            } else {
              setUser(session.user)
            }
          } else {
            setUser(null)
          }
          setLoading(false)
          setSyncing(false)
        }
      } catch (error) {
        if (mounted) {
          setUser(null)
          setLoading(false)
          setSyncing(false)
        }
      }
    }

    // Sincronização imediata
    syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (event === 'SIGNED_IN' && session?.user) {
          // Salvar timestamp do login
          localStorage.setItem('session_start', Date.now().toString())
          setUser(session.user)
          setLoading(false)
          setSyncing(false)
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('session_start')
          setUser(null)
          setLoading(false)
          setSyncing(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Verificar se a sessão expirou por tempo limite
          const sessionExpired = await checkSessionExpiry(supabase)
          if (sessionExpired) {
            setUser(null)
          } else {
            setUser(session.user)
          }
          setLoading(false)
          setSyncing(false)
        } else if (session?.user) {
          // Verificar se a sessão expirou por tempo limite
          const sessionExpired = await checkSessionExpiry(supabase)
          if (sessionExpired) {
            setUser(null)
          } else {
            setUser(session.user)
          }
          setLoading(false)
          setSyncing(false)
        } else {
          setUser(null)
          setLoading(false)
          setSyncing(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Cria um novo erro com a mensagem traduzida
        const translatedError = new Error(translateAuthError(error.message))
        return { error: translatedError }
      }

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      const translatedError = new Error(translateAuthError(errorMessage))
      return { error: translatedError }
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, syncing, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
