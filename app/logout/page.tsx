'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function doLogout() {
      await signOut()
      router.replace('/')
    }
    doLogout()
  }, [signOut, router])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <span className="ml-4">Saindo...</span>
    </div>
  )
}
