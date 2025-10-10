'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
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
  const { user } = useAuth()
  const [division, setDivision] = useState<Division | null>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!divisionId) {
        setError('ID da divisão não fornecido.')
        setLoading(false)
        return
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

      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Erro ao carregar informações.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [divisionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
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
            <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">Erro</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/biblioteca">
              <Button className="w-full mt-4" variant="outline">
                Voltar para Biblioteca
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
          <div className="rounded-full bg-green-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">Compra Realizada!</CardTitle>
          <CardDescription className="text-green-600">
            Seu pagamento foi processado com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {division?.title}
            </h3>
            <p className="text-gray-600 mb-4">
              por {book?.author}
            </p>
            <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Acesso Liberado
            </div>
          </div>
          
          <div className="space-y-3">
            <Link href={`/dashboard/biblioteca/shulchan-aruch/${divisionId}`}>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold flex items-center justify-center gap-2">
                <Book className="h-5 w-5" />
                Acessar Tratado
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/dashboard/biblioteca/shulchan-aruch">
              <Button variant="outline" className="w-full">
                Ver Todos os Tratados
              </Button>
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Você receberá um email de confirmação em breve.</p>
            <p>Obrigado por sua compra!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}