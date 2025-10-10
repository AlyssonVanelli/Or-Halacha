// /pages/support.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import { SUPPORT_MESSAGES, SUPPORT_CONFIG } from '@/constants/support'

export default function SupportPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validações para usuários não logados
    if (!user) {
      if (!name.trim()) {
        setErrorMessage('Nome é obrigatório')
        return
      }
      if (!email.trim()) {
        setErrorMessage('Email é obrigatório')
        return
      }
      if (!email.includes('@')) {
        setErrorMessage('Email inválido')
        return
      }
    }

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
          user_id: user?.id || null,
          name: user?.user_metadata?.['full_name'] || name,
          email: user?.email || email,
          subject: 'Suporte',
          message,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }

      setStatus('sent')
      setMessage('')
      setName('')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setErrorMessage(SUPPORT_MESSAGES.ERROR.DESCRIPTION)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <HeaderSimplificado />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="rounded-full bg-blue-500 p-3">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Central de Suporte</h1>
                <p className="mt-2 text-lg text-gray-600">Estamos aqui para ajudar você</p>
              </div>
            </div>
          </div>

          {/* Formulário de Suporte */}
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl bg-white p-8 shadow-lg">
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-bold text-gray-800">
                  {user?.user_metadata?.['full_name']
                    ? `Olá, ${user.user_metadata['full_name']}!`
                    : 'Olá! Como podemos ajudar?'}
                </h2>
                <p className="text-gray-600">
                  Descreva sua dúvida ou problema em detalhes para que possamos ajudá-lo da melhor
                  forma possível.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campos para usuários não logados */}
                {!user && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        disabled={loading || status === 'sent'}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        disabled={loading || status === 'sent'}
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Sua mensagem
                  </label>
                  <Textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={SUPPORT_MESSAGES.PLACEHOLDER}
                    className="min-h-[200px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading || status === 'sent'}
                  />
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">
                      {message.length}/{SUPPORT_CONFIG.MAX_MESSAGE_LENGTH} caracteres
                    </span>
                    {message.length < SUPPORT_CONFIG.MIN_MESSAGE_LENGTH && (
                      <span className="text-orange-500">
                        Mínimo {SUPPORT_CONFIG.MIN_MESSAGE_LENGTH} caracteres
                      </span>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
                      <span className="font-medium text-red-700">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {status === 'sent' && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center">
                      <svg
                        className="mr-2 h-5 w-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-green-800">
                          {SUPPORT_MESSAGES.SUCCESS.TITLE}
                        </h3>
                        <p className="text-green-700">{SUPPORT_MESSAGES.SUCCESS.DESCRIPTION}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || status === 'sent'}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-lg font-semibold shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Mensagem'
                  )}
                </Button>
              </form>
            </div>

            {/* Informações de Contato */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Email</h3>
                </div>
                <p className="text-gray-600">suporte@orhalacha.com</p>
                <p className="mt-1 text-sm text-gray-500">Resposta em até 24 horas</p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Horário</h3>
                </div>
                <p className="text-gray-600">Domingo a Quinta</p>
                <p className="mt-1 text-sm text-gray-500">16h às 22h (horário de Israel)</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2025 Or Halachá. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <a href="/termos" className="text-sm text-gray-500 underline-offset-4 hover:underline">
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
  )
}
