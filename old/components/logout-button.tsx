'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LogoutButton({ variant = 'ghost', size = 'icon' }: LogoutButtonProps) {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    // Forçar um redirecionamento completo
    window.location.href = '/'
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout}>
      <LogOut className="h-5 w-5" />
      <span className="sr-only">Sair</span>
    </Button>
  )
}
