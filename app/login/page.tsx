'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Mail, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { translateAuthErrorForLogin } from '@/lib/error-translations'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [urlMessage, setUrlMessage] = useState('')
  const router = useRouter()
  const { signIn, user } = useAuth()
  const { toast } = useToast()

  // Verificar mensagens da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const message = urlParams.get('message')

    if (message === 'subscription-expired') {
      setUrlMessage(
        'Sua assinatura expirou ou foi cancelada. Entre em contato conosco para renovar.'
      )
      toast({
        title: 'Assinatura Expirada',
        description: 'Sua assinatura foi cancelada. Entre em contato conosco para renovar.',
        variant: 'destructive',
      })
    } else if (message === 'verification-error') {
      setUrlMessage('Erro ao verificar sua assinatura. Tente fazer login novamente.')
      toast({
        title: 'Erro de Verificação',
        description: 'Erro ao verificar sua assinatura. Tente fazer login novamente.',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    if (user) {
      // Delay maior para garantir que o estado foi atualizado e evitar loops
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    }
  }, [user, router])

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Redirecionando para o dashboard...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setShowEmailConfirmation(false)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        // Se o erro for de email não confirmado, mostra opção de reenviar
        if (
          error.message.includes('Email não confirmado') ||
          error.message.includes('Email not confirmed')
        ) {
          setShowEmailConfirmation(true)
          toast({
            title: 'Email não confirmado',
            description:
              'Confirme seu email antes de fazer login. Use o botão abaixo para reenviar o email de confirmação.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Erro ao entrar',
            description: translateAuthErrorForLogin(error),
            variant: 'destructive',
          })
        }
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

  const handleResendEmail = async () => {
    setIsResendingEmail(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast({
          title: 'Erro ao reenviar email',
          description: 'Não foi possível reenviar o email. Tente novamente.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Email reenviado',
          description: 'Verifique sua caixa de entrada e clique no link de confirmação.',
        })
        setShowEmailConfirmation(false)
      }
    } catch (error) {
      toast({
        title: 'Erro ao reenviar email',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsResendingEmail(false)
    }
  }

  return (
    <>
      <HeaderSimplificado />
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-lg">
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <h2 className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-3xl font-bold text-transparent">
                Or Halachá
              </h2>
              <p className="mt-2 text-sm text-gray-600">Plataforma de Estudo Haláchico</p>
            </div>
            <div className="rounded-2xl border-0 bg-gradient-to-br from-white to-blue-50/30 py-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="px-8 pb-4 pt-8">
                <h1 className="text-center text-3xl font-bold text-gray-800">Acesse sua conta</h1>
                <p className="mt-3 text-center text-base text-gray-600">
                  Bem-vindo de volta! Faça login para acessar o conteúdo completo.
                </p>
              </div>
              <div className="px-8 pb-8">
                {urlMessage && (
                  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center">
                      <svg
                        className="mr-2 h-5 w-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium text-red-700">{urlMessage}</span>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-12 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                        Senha
                      </Label>
                      <Link
                        href="/reset-password"
                        className="text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
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
                      className="h-12 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-200 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  {showEmailConfirmation && (
                    <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-3 text-sm text-amber-700 shadow-sm">
                      <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold">Email não confirmado</p>
                          <p className="mt-1">
                            Confirme seu email antes de fazer login. Clique no botão abaixo para
                            reenviar o email de confirmação.
                          </p>
                          <Button
                            onClick={handleResendEmail}
                            disabled={isResendingEmail}
                            className="mt-3 bg-amber-600 text-white hover:bg-amber-700"
                            size="sm"
                          >
                            {isResendingEmail ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Reenviando...
                              </>
                            ) : (
                              <>
                                <Mail className="mr-2 h-4 w-4" />
                                Reenviar Email
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
                <div className="mt-8 text-center text-sm text-gray-600">
                  Não tem uma conta?{' '}
                  <Link
                    href="/signup"
                    className="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-700"
                  >
                    Cadastre-se
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="mt-auto border-t border-gray-200 bg-white/50 py-6">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
              © 2025 Or Halachá. Todos os direitos reservados.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/termos"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Termos de Uso
              </a>
              <a
                href="/privacidade"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Privacidade
              </a>
              <a
                href="/politica-compra"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Compra
              </a>
              <a
                href="/politica-reembolso"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Reembolso
              </a>
              <a
                href="/politica-copia"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Cópia
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
