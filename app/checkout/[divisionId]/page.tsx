'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Division {
  id: string
  title: string
  book_id: string
}

interface Book {
  id: string
  title: string
  author: string
}

export default function CheckoutPage() {
  const params = useParams()
  const divisionId = params.divisionId as string
  const { user } = useAuth()
  const [division, setDivision] = useState<Division | null>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!divisionId) {
        setError('ID da divisão não fornecido.')
        setLoading(false)
        return
      }

      if (!user) {
        setError('Usuário não autenticado.')
        setLoading(false)
        return
      }

      // Limpar cache antigo (mais de 5 minutos)
      const cacheKey = `checkout_${divisionId}_${user.id}`
      const cachedSession = localStorage.getItem(cacheKey)
      if (cachedSession) {
        const sessionData = JSON.parse(cachedSession)
        if (Date.now() - sessionData.timestamp > 300000) {
          // 5 minutos
          localStorage.removeItem(cacheKey)
        }
      }

      try {
        const supabase = createClient()

        // Buscar informações da divisão
        const { data: divisionData, error: divisionError } = await supabase
          .from('divisions')
          .select('id, title, book_id')
          .eq('id', divisionId)
          .single()

        if (divisionError || !divisionData) {
          setError('Divisão não encontrada.')
          return
        }

        setDivision(divisionData)

        // Buscar informações do livro
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('id, title, author')
          .eq('id', divisionData.book_id)
          .single()

        if (bookError || !bookData) {
          setError('Livro não encontrado.')
          return
        }

        setBook(bookData)

        // Verificar se já existe uma sessão ativa no localStorage
        const cacheKey = `checkout_${divisionId}_${user.id}`
        const cachedSession = localStorage.getItem(cacheKey)
        const now = Date.now()

        // Se existe uma sessão nos últimos 2 minutos, usar ela
        if (cachedSession) {
          const sessionData = JSON.parse(cachedSession)
          if (now - sessionData.timestamp < 120000) {
            // 2 minutos
            setTimeout(() => {
              setRedirecting(true)
              window.location.href = sessionData.checkoutUrl
            }, 500)
            return
          }
        }

        // Criar sessão de checkout no servidor
        try {
          const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              divisionId,
              userId: user.id,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar sessão de checkout')
          }

          // Cachear a sessão no localStorage
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              checkoutUrl: data.checkoutUrl,
              timestamp: now,
            })
          )

          // Redirecionar para o Stripe após carregar os dados
          setTimeout(() => {
            setRedirecting(true)
            window.location.href = data.checkoutUrl
          }, 1000)
        } catch (error) {
          setError('Erro ao processar compra. Tente novamente.')
        }
      } catch (err) {
        setError('Erro ao carregar informações.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [divisionId, user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Carregando informações do tratado...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 p-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">Erro</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="mt-4 w-full" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Redirecionando para o pagamento...</p>
          <p className="mt-2 text-sm text-gray-500">
            Você será direcionado para o Stripe em instantes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Preparando Pagamento</CardTitle>
          <CardDescription className="text-gray-600">
            Carregando informações do tratado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold text-gray-800">{division?.title}</h3>
            <p className="mb-4 text-gray-600">por {book?.author}</p>
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              R$ 29,90
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Você será redirecionado para o Stripe em breve.</p>
            <p>Por favor, aguarde...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
