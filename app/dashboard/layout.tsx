'use client'

import type React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (user) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main>{children}</main>
        <DashboardFooter />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  )
}
