'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
// import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Book } from 'lucide-react'
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

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const divisionId = searchParams.get('divisionId')
  // const { user } = useAuth()
  const [division, setDivision] = useState<Division | null>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      console.log('🚨🚨🚨 PÁGINA DE SUCESSO CARREGADA 🚨🚨🚨')
      console.log('🚨 Timestamp:', new Date().toISOString())
      console.log('🚨 URL completa:', window.location.href)
      console.log('🚨 Division ID da URL:', divisionId)
      console.log('🚨 Search params:', window.location.search)
      console.log('🚨 Pathname:', window.location.pathname)
      console.log('🚨 Hash:', window.location.hash)

      // Verificar se o usuário está logado
      console.log('🔐 Verificando autenticação...')
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log('🔐 Usuário logado:', !!user)
      console.log('🔐 User ID:', user?.id)
      console.log('🔐 User email:', user?.email)

      if (!user) {
        console.error('❌ Usuário não encontrado - redirecionando para login')
        window.location.href = '/login'
        return
      }

      // Se não há divisionId, é uma assinatura (não compra de tratado individual)
      if (!divisionId) {
        // Sincronizar assinatura com o banco
        try {
          console.log('=== SINCRONIZANDO ASSINATURA ===')

          // Buscar o profile para obter o stripe_customer_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

          if (!profile?.stripe_customer_id) {
            console.error('Customer ID não encontrado no profile')
            return
          }

          console.log('Customer ID encontrado:', profile.stripe_customer_id)

          const response = await fetch('/api/check-subscription-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: profile.stripe_customer_id,
            }),
          })

          if (response.ok) {
            console.log('Assinatura sincronizada com sucesso')
          } else {
            console.error('Erro ao sincronizar assinatura')
          }
        } catch (error) {
          console.error('Erro na sincronização:', error)
        }

        setLoading(false)
        return
      }

      try {
        console.log('📚 CARREGANDO DADOS DO TRATADO')
        console.log('📚 Division ID:', divisionId)
        console.log('📚 User ID:', user.id)

        const supabase = createClient()

        // Buscar informações da divisão
        console.log('🔍 Buscando divisão no banco...')
        const { data: divisionData, error: divisionError } = await supabase
          .from('divisions')
          .select('id, title, book_id')
          .eq('id', divisionId)
          .single()

        if (divisionError || !divisionData) {
          console.error('❌ Erro ao buscar divisão:', divisionError)
          setError('Divisão não encontrada.')
          return
        }

        console.log('✅ Divisão encontrada:', divisionData)
        setDivision(divisionData)

        // Buscar informações do livro
        console.log('🔍 Buscando livro no banco...')
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('id, title, author')
          .eq('id', divisionData.book_id)
          .single()

        if (bookError || !bookData) {
          console.error('❌ Erro ao buscar livro:', bookError)
          setError('Livro não encontrado.')
          return
        }

        console.log('✅ Livro encontrado:', bookData)
        setBook(bookData)

        // Verificar se o usuário já tem acesso ao tratado
        console.log('🔍 Verificando acesso atual ao tratado...')
        const { data: existingAccess, error: accessError } = await supabase
          .from('purchased_books')
          .select('*')
          .eq('user_id', user.id)
          .eq('division_id', divisionId)

        if (accessError) {
          console.error('❌ Erro ao verificar acesso:', accessError)
        } else {
          console.log('📋 Acesso atual ao tratado:', existingAccess)
          if (existingAccess && existingAccess.length > 0) {
            console.log('✅ Usuário já tem acesso ao tratado!')
            console.log('📅 Data de expiração:', existingAccess[0].expires_at)
            console.log('💳 Payment Intent ID:', existingAccess[0].stripe_payment_intent_id)
          } else {
            console.log('⚠️ Usuário NÃO tem acesso ao tratado ainda')
            console.log('⚠️ O webhook pode não ter processado ainda')
          }
        }
      } catch (err) {
        console.error('❌ Erro geral ao carregar dados:', err)
        setError('Erro ao carregar informações.')
      } finally {
        console.log('🏁 Finalizando carregamento da página de sucesso')
        console.log('🏁 Division:', division)
        console.log('🏁 Book:', book)
        console.log('🏁 Loading:', loading)
        console.log('🏁 Error:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [divisionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Processando sua compra...</p>
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
              <span className="text-2xl">❌</span>
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">Erro</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="mt-4 w-full" variant="outline">
                Voltar para Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 p-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">
            {divisionId ? 'Compra Realizada!' : 'Assinatura Ativada!'}
          </CardTitle>
          <CardDescription className="text-green-600">
            {divisionId
              ? 'Seu pagamento foi processado com sucesso'
              : 'Sua assinatura foi ativada com sucesso'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {divisionId ? (
              <h3 className="mb-2 text-xl font-semibold text-gray-800">{division?.title}</h3>
            ) : (
              <h3 className="mb-2 text-xl font-semibold text-gray-800">Acesso Completo Ativado</h3>
            )}
            {divisionId && <p className="mb-4 text-gray-600">por {book?.author}</p>}
            <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <CheckCircle className="mr-1 h-4 w-4" />
              Acesso Liberado
            </div>
          </div>

          <div className="space-y-3">
            {divisionId ? (
              <>
                <Link
                  href={`/dashboard/biblioteca/shulchan-aruch/${divisionId}`}
                  onClick={() => {
                    console.log('🔗 Clicando em "Acessar Tratado"')
                    console.log('🔗 Division ID:', divisionId)
                    console.log(
                      '🔗 URL de destino:',
                      `/dashboard/biblioteca/shulchan-aruch/${divisionId}`
                    )
                  }}
                >
                  <Button className="flex w-full items-center justify-center gap-2 bg-green-600 py-3 text-lg font-semibold text-white hover:bg-green-700">
                    <Book className="h-5 w-5" />
                    Acessar Tratado
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>

                <Link
                  href="/dashboard/biblioteca/shulchan-aruch"
                  onClick={() => {
                    console.log('🔗 Clicando em "Ver Todos os Tratados"')
                    console.log('🔗 URL de destino:', '/dashboard/biblioteca/shulchan-aruch')
                  }}
                >
                  <Button variant="outline" className="w-full">
                    Ver Todos os Tratados
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard/biblioteca/shulchan-aruch">
                  <Button className="flex w-full items-center justify-center gap-2 bg-green-600 py-3 text-lg font-semibold text-white hover:bg-green-700">
                    <Book className="h-5 w-5" />
                    Acessar Biblioteca
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Ir para Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="text-sm text-gray-500">
            <p>Você receberá um email de confirmação em breve.</p>
            <p>{divisionId ? 'Obrigado por sua compra!' : 'Obrigado por sua assinatura!'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
