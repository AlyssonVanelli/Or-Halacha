'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { HeaderSimplificado } from '@/components/DashboardHeader'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn, user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  if (user) {
    return null // Não renderiza nada enquanto redireciona
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        toast({
          title: 'Erro ao entrar',
          description: error.message || 'Verifique suas credenciais e tente novamente.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Login realizado com sucesso',
          description: 'Você foi redirecionado para o dashboard',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro ao entrar',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <HeaderSimplificado />
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="flex flex-col items-center">
              <BookOpen className="mb-2 h-10 w-10 text-blue-700 dark:text-blue-400" />
              <span className="text-2xl font-bold text-slate-800 dark:text-white">Or Halacha</span>
            </div>
            <div className="rounded-2xl border-0 bg-white/90 py-6 shadow-xl dark:bg-slate-950/90">
              <div className="px-6 pb-2 pt-6">
                <h1 className="text-center text-2xl font-bold">Acesse sua conta</h1>
                <p className="mt-2 text-center text-base font-normal text-gray-500 dark:text-gray-400">
                  Bem-vindo de volta! Faça login para acessar o conteúdo completo.
                </p>
              </div>
              <div className="px-6 pb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="bg-blue-50 dark:bg-slate-900/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Link
                        href="/reset-password"
                        className="text-sm text-blue-700 hover:underline dark:text-blue-400"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="bg-blue-50 dark:bg-slate-900/40"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
                  Não tem uma conta?{' '}
                  <Link
                    href="/signup"
                    className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                  >
                    Cadastre-se
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="mt-auto border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
              © 2025 Or Halachá. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <a
                href="/termos"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Termos de Uso
              </a>
              <a
                href="/privacidade"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
