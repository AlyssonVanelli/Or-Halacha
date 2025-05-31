'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function syncUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        if (mounted) {
          setUser(session.user)
          setLoading(false)
        }
      } else if (session) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (mounted) {
          setUser(user ?? null)
          setLoading(false)
        }
      } else {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user)
          setLoading(false)
        } else if (session) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user ?? null)
            setLoading(false)
          })
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname])

  async function signIn(email: string, password: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
