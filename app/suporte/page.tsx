// /pages/support.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'
import { SUPPORT_MESSAGES, SUPPORT_CONFIG } from '@/constants/support'

export default function SupportPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (message.length < SUPPORT_CONFIG.MIN_MESSAGE_LENGTH) {
      setErrorMessage(SUPPORT_MESSAGES.MIN_LENGTH)
      return
    }

    if (message.length > SUPPORT_CONFIG.MAX_MESSAGE_LENGTH) {
      setErrorMessage(SUPPORT_MESSAGES.MAX_LENGTH)
      return
    }

    setLoading(true)
    setStatus('sending')
    setErrorMessage('')

    try {
      const response = await fetch('/api/support/create-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          name: user.user_metadata?.['full_name'] || 'Usuário',
          email: user.email,
          subject: 'Suporte',
          message,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }

      setStatus('sent')
      setMessage('')
    } catch (error) {
      setStatus('error')
      setErrorMessage(SUPPORT_MESSAGES.ERROR.DESCRIPTION)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Acesso Restrito</h1>
          <p className="mb-4 text-gray-600">Faça login para acessar o suporte.</p>
          <Button onClick={() => (window.location.href = '/login')}>Fazer Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader />
      <main className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Suporte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h2 className="mb-2 text-lg font-semibold">
                    {user.user_metadata?.['full_name']
                      ? SUPPORT_MESSAGES.GREETING.replace(
                          '{email}',
                          user.user_metadata['full_name']
                        )
                      : SUPPORT_MESSAGES.GREETING.replace('{email}', 'Usuário')}
                  </h2>
                  <p className="text-gray-600">
                    Descreva sua dúvida ou problema em detalhes para que possamos ajudá-lo da melhor
                    forma possível.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={SUPPORT_MESSAGES.PLACEHOLDER}
                      className="min-h-[200px]"
                      disabled={loading || status === 'sent'}
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      {message.length}/{SUPPORT_CONFIG.MAX_MESSAGE_LENGTH} caracteres
                    </div>
                  </div>

                  {errorMessage && <div className="text-sm text-red-600">{errorMessage}</div>}

                  {status === 'sent' && (
                    <div className="rounded bg-green-50 p-4 text-green-700">
                      <h3 className="font-semibold">{SUPPORT_MESSAGES.SUCCESS.TITLE}</h3>
                      <p>{SUPPORT_MESSAGES.SUCCESS.DESCRIPTION}</p>
                    </div>
                  )}

                  <Button type="submit" disabled={loading || status === 'sent'} className="w-full">
                    {loading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <DashboardFooter />
    </div>
  )
}
