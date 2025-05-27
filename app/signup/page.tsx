'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { BookOpen, ShieldCheck } from 'lucide-react'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError

      await signIn(email, password)
    } catch (err) {
      setError('Erro ao realizar cadastro. Tente novamente.')
    } finally {
      setLoading(false)
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
                <h1 className="text-center text-2xl font-bold">Crie sua conta</h1>
                <p className="mt-2 text-center text-base font-normal text-gray-500 dark:text-gray-400">
                  Acesse todo o conteúdo do Shulchan Aruch em português
                </p>
              </div>
              <div className="px-6 pb-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Seu e-mail"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="bg-blue-50 dark:bg-slate-900/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Senha (mín. 8 caracteres)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="bg-blue-50 dark:bg-slate-900/40"
                    />
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                      Use letras, números e símbolos para uma senha forte
                    </div>
                  </div>
                  {error && (
                    <div className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
                  Já tem uma conta?{' '}
                  <a
                    href="/login"
                    className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                  >
                    Entrar
                  </a>
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
