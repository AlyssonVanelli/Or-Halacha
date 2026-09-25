'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

// Passo 2 da recuperação: o link do email loga o usuário (/auth/callback) e traz para cá
export default function UpdatePasswordPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')
    setSaving(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    setSaving(false)
    if (updateError) return setError('Não foi possível salvar a nova senha. Tente novamente.')
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HeaderSimplificado />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Criar nova senha</h1>
          {!user ? (
            <>
              <p className="mb-6 text-gray-600">
                O link expirou ou já foi usado. Peça um novo link de recuperação.
              </p>
              <Button asChild className="w-full">
                <Link href="/reset-password">Pedir novo link</Link>
              </Button>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar nova senha'}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
