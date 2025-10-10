'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, CheckCircle, Star } from 'lucide-react'
import Link from 'next/link'

interface Division {
  id: string
  title: string
  description: string | null
  book_id: string
}

export default function PaymentPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const divisionId = searchParams.get('divisionId')
  
  const [division, setDivision] = useState<Division | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDivision() {
      if (!divisionId) {
        setError('ID da divisão não fornecido')
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        
        const { data: divisionData, error: divisionError } = await supabase
          .from('divisions')
          .select('*')
          .eq('id', divisionId)
          .single()

        if (divisionError) {
          setError('Divisão não encontrada')
          return
        }

        setDivision(divisionData)
      } catch (error) {
        setError('Erro ao carregar informações da divisão')
      } finally {
        setLoading(false)
      }
    }

    loadDivision()
  }, [divisionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (error || !division) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Erro ao Carregar
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Divisão não encontrada'}
          </p>
          <Link href="/dashboard/biblioteca">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Voltar para Biblioteca
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/biblioteca"
            className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Biblioteca
          </Link>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header do Tratado */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-white/20 p-3">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{division.title}</h1>
                  {division.description && (
                    <p className="text-blue-100 mt-2">{division.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Opções de Compra */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Escolha sua opção de acesso
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Opção 1: Tratado Individual */}
                <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50 relative">
                  <div className="absolute -top-3 left-6 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Recomendado
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {division.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Acesso completo a este tratado específico
                    </p>
                    <div className="text-3xl font-bold text-green-600 mb-4">
                      R$ 29,90
                    </div>
                    <ul className="text-left space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Acesso completo ao tratado</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Todos os simanim e seifim</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Pesquisa avançada</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Acesso vitalício</span>
                      </li>
                    </ul>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Comprar Este Tratado
                    </Button>
                  </div>
                </div>

                {/* Opção 2: Assinatura Completa */}
                <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-xl font-bold text-gray-800">
                        Assinatura Completa
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Acesso a todos os tratados + recursos premium
                    </p>
                    <div className="text-3xl font-bold text-blue-600 mb-4">
                      R$ 19,90/mês
                    </div>
                    <ul className="text-left space-y-2 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Todos os 4 tratados</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Explicações práticas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Pesquisa avançada</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Suporte prioritário</span>
                      </li>
                    </ul>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-3">
                        Ver Planos Completos
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  💳 Pagamento seguro via Stripe • 🔒 Dados protegidos • 📱 Acesso em qualquer dispositivo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}