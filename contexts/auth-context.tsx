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
            setUser(session.user)
          } else {
            setUser(null)
          }
          setLoading(false)
          setSyncing(false)
        }
      } catch (error) {
        console.error('Erro ao sincronizar usuário:', error)
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
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, setting user state...')
          setUser(session.user)
          setLoading(false)
          setSyncing(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing user state...')
          setUser(null)
          setLoading(false)
          setSyncing(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed, updating user state...')
          setUser(session.user)
          setLoading(false)
          setSyncing(false)
        } else if (session?.user) {
          console.log('Session available, setting user state...')
          setUser(session.user)
          setLoading(false)
          setSyncing(false)
        } else {
          console.log('No session, clearing user state...')
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
        console.error('❌ Erro no signIn:', error)
        // Cria um novo erro com a mensagem traduzida
        const translatedError = new Error(translateAuthError(error.message))
        return { error: translatedError }
      }

      return { error: null }
    } catch (error) {
      console.error('💥 Erro inesperado no signIn:', error)
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
