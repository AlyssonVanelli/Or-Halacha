'use client'

import type React from 'react'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

interface UserAuthFormProps {
  type: 'login' | 'signup'
  redirectTo?: string
  defaultValues?: {
    email?: string
    name?: string
  }
}

export function UserAuthForm({
  type,
  redirectTo = '/dashboard',
  defaultValues = {},
}: UserAuthFormProps) {
  const [name, setName] = useState(defaultValues.name || '')
  const [email, setEmail] = useState(defaultValues.email || '')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (type === 'login') {
        const { error } = await signIn(email, password)

        if (error) {
          toast({
            title: 'Erro ao entrar',
            description: error.message,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Login realizado com sucesso',
            description: 'Você foi redirecionado para o dashboard',
          })
          router.push(redirectTo)
        }
      }
    } catch (error) {
      toast({
        title: `Erro ao ${type === 'login' ? 'entrar' : 'criar conta'}`,
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading
          ? type === 'login'
            ? 'Entrando...'
            : 'Criando conta...'
          : type === 'login'
            ? 'Entrar'
            : 'Criar conta'}
      </Button>
    </form>
  )
}
