'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { createClient } from '@/lib/supabase/client'

// Passo 1 da recuperação: envia o link por email
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    // Mesmo resultado para email existente ou não (não revela quem tem conta)
    setStatus(error && error.status !== 400 ? 'error' : 'sent')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HeaderSimplificado />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Recuperar senha</h1>
          {status === 'sent' ? (
            <>
              <p className="mb-6 text-gray-600">
                Se houver uma conta com <b>{email}</b>, você vai receber um email com o link para
                criar uma nova senha. Confira também a caixa de spam.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Voltar para o login</Link>
              </Button>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-gray-600">
                Digite o email da sua conta e enviaremos um link para criar uma nova senha.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-600" role="alert">
                  Não foi possível enviar agora. Tente novamente em alguns minutos.
                </p>
              )}
              <Button type="submit" className="w-full" disabled={status === 'sending'}>
                {status === 'sending' ? 'Enviando…' : 'Enviar link'}
              </Button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-blue-700 hover:underline">
                  Lembrei a senha
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
