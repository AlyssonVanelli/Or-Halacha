'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { translateAuthError } from '@/lib/error-translations'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LogoutButton({ variant = 'ghost', size = 'icon' }: LogoutButtonProps) {
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await signOut()
      // Forçar um redirecionamento completo
      window.location.href = '/'
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao sair',
        description: translateAuthError(errorMessage),
        variant: 'destructive',
      })
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout}>
      <LogOut className="h-5 w-5" />
      <span className="sr-only">Sair</span>
    </Button>
  )
}
