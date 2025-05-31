'use client'

import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main>{children}</main>
      <DashboardFooter />
    </div>
  )
}
