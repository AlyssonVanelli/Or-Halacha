'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Book } from 'lucide-react'

interface Book {
  id: string
  title: string
  description: string | null
}

interface Division {
  id: string
  title: string
  description: string | null
  book_id: string
}

export default function BookPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const livroId = params.livroId as string
  const [book, setBook] = useState<Book | null>(null)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
      return
    }

    if (!loading && user && livroId) {
      loadBookData()
    }
  }, [user, loading, livroId, router])

  async function loadBookData() {
    if (!user || !livroId) return

    try {
      const supabase = createClient()

      // Carregar livro
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', livroId)
        .single()

      if (bookError) {
        console.error('Erro ao carregar livro:', bookError)
        return
      }

      setBook(bookData)

      // Carregar divisões
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions')
        .select('*')
        .eq('book_id', livroId)
        .order('position')

      if (divisionsError) {
        console.error('Erro ao carregar divisões:', divisionsError)
        return
      }

      setDivisions(divisionsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <DashboardAccessGuard>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="ml-4 text-lg text-gray-600">Carregando...</p>
        </div>
      </DashboardAccessGuard>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardAccessGuard>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="flex-1">
          <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Dashboard
              </Link>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-500 p-3">
                  <Book className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">{book?.title}</h1>
                  {book?.description && (
                    <p className="mt-2 text-lg text-gray-600">{book.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de Divisões */}
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold text-gray-800">Divisões</h2>
                <p className="text-lg text-gray-600">Selecione uma divisão para estudar</p>
              </div>

              {divisions.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 p-4">
                    <Book className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-600">
                    Nenhuma Divisão Encontrada
                  </h3>
                  <p className="mb-6 text-gray-500">
                    Este livro ainda não possui divisões disponíveis.
                  </p>
                  <Link href="/dashboard">
                    <Button variant="outline">Voltar para Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {divisions.map((division, index) => {
                    const colors = [
                      'from-blue-500 to-blue-600',
                      'from-green-500 to-green-600',
                      'from-purple-500 to-purple-600',
                      'from-orange-500 to-orange-600',
                      'from-red-500 to-red-600',
                      'from-indigo-500 to-indigo-600',
                    ]

                    return (
                      <Link
                        key={division.id}
                        href={`/livros/${livroId}/divisoes/${division.id}`}
                        className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                      >
                        {/* Header com gradiente */}
                        <div
                          className={`h-20 bg-gradient-to-r ${colors[index % colors.length]} p-4`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="rounded-full bg-white/20 p-2">
                              <Book className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-lg font-bold text-white">{index + 1}</div>
                          </div>
                        </div>

                        {/* Conteúdo do card */}
                        <div className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-gray-800">
                            {division.title}
                          </h3>
                          {division.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {division.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </DashboardAccessGuard>
  )
}
