'use client'

import { useState } from 'react'
// import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { BookOpen, ShieldCheck, FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { translateAuthError } from '@/lib/error-translations'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const { signIn } = useAuth()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validações básicas
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido.')
      setLoading(false)
      return
    }

    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Você deve aceitar os Termos de Uso para continuar.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        // Se o erro for de usuário já existente, redireciona para login
        if (
          signUpError.message.includes('already') ||
          signUpError.message.includes('already registered') ||
          signUpError.message.includes('User already')
        ) {
          setError(
            'ℹ️ Este email já está cadastrado. Se você não confirmou o email, faça login para reenviar a confirmação.'
          )
          setTimeout(() => {
            window.location.href = '/login'
          }, 3000)
          return
        }

        throw signUpError
      }

      // Se o signup foi bem-sucedido e temos um usuário, registrar o consentimento
      if (signUpData.user) {
        try {
          const consentResponse = await fetch('/api/consent/record-consent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: signUpData.user.id,
              consent_type: 'terms_of_use',
            }),
          })

          if (!consentResponse.ok) {
          }
        } catch (consentError) {}
      }

      setError(
        '✅ Email de confirmação enviado! Verifique sua caixa de entrada e clique no link para ativar sua conta.'
      )
    } catch (err) {
      let errorMessage = 'Erro desconhecido'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message)
      }

      const translatedError = translateAuthError(errorMessage)
      setError(translatedError)
    } finally {
      setLoading(false)
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
                <h1 className="text-center text-3xl font-bold text-gray-800">Crie sua conta</h1>
                <p className="mt-3 text-center text-base text-gray-600">
                  Acesse todo o conteúdo do Shulchan Aruch em português
                </p>
              </div>
              <div className="px-8 pb-8">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Seu e-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-12 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Senha (mín. 8 caracteres)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-12 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-200 focus:border-blue-500"
                    />
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                      Use letras, números e símbolos para uma senha forte
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="acceptTerms"
                        checked={acceptTerms}
                        onCheckedChange={checked => setAcceptTerms(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="acceptTerms"
                          className="cursor-pointer text-sm text-gray-700"
                        >
                          Aceito os{' '}
                          <a
                            href="/termos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 underline hover:text-blue-700"
                          >
                            Termos de Uso
                          </a>{' '}
                          e a{' '}
                          <a
                            href="/privacidade"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 underline hover:text-blue-700"
                          >
                            Política de Privacidade
                          </a>
                        </Label>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FileText className="h-3 w-3 text-blue-500" />
                          <span>Leia os termos antes de aceitar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {error && (
                    <div
                      className={`rounded-lg border-l-4 px-4 py-3 text-sm shadow-sm ${
                        error.includes('✅')
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 text-green-700'
                          : error.includes('ℹ️')
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700'
                            : 'border-red-500 bg-gradient-to-r from-red-50 to-red-100 text-red-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full ${
                            error.includes('✅')
                              ? 'bg-green-500'
                              : error.includes('ℹ️')
                                ? 'bg-blue-500'
                                : 'bg-red-500'
                          }`}
                        ></div>
                        <div>
                          <p className="font-semibold">
                            {error.includes('✅')
                              ? 'Sucesso!'
                              : error.includes('ℹ️')
                                ? 'Informação'
                                : 'Erro no cadastro'}
                          </p>
                          <p className="mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                    disabled={loading}
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
                <div className="mt-8 text-center text-sm text-gray-600">
                  Já tem uma conta?{' '}
                  <a
                    href="/login"
                    className="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-700"
                  >
                    Entrar
                  </a>
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
            <div className="flex gap-6">
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
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
