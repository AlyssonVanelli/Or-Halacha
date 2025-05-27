'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { db } from '@/lib/db'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
import type { Book, Division, Category } from '../types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

// Definir tipo para o item de livro retornado
interface BookListItem {
  id: string
  title: string
  author: string | null
  slug: string
  description: string | null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [authors, setAuthors] = useState<string[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  const router = useRouter()
  const [purchasedBooks, setPurchasedBooks] = useState<string[]>([])
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Buscar livros (apenas campos principais)
        const supabase = createClient()
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('id, title, author, slug, description')
          .order('title')
        if (booksError) throw booksError
        setBooks((booksData || []).map((b: BookListItem) => ({ ...b, divisions: [] })))

        // Divisões (tratados) - apenas campos necessários
        const { data: divisionsData, error: divisionsError } = await supabase
          .from('divisions')
          .select('id, title, book_id, position')
          .order('position')
        if (divisionsError) throw divisionsError
        setDivisions(divisionsData || [])
      } catch (error) {
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar o dashboard. Tente novamente mais tarde.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  useEffect(() => {
    // Compras e assinatura dependem do user
    if (!user) return
    const fetchUserData = async () => {
      try {
        const supabase = createClient()
        const { data: purchasedData } = await supabase
          .from('purchased_books')
          .select('division_id')
          .eq('user_id', user.id)
        setPurchasedBooks(purchasedData?.map(item => item.division_id) || [])
      } catch {}
    }
    fetchUserData()
  }, [user])

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        // Remover a linha: const supabase = createClient()
      }
    }
    checkAdmin()
  }, [user])

  useEffect(() => {
    async function fetchCategories() {
      const cats = await db.categories.getAll()
      setCategories(cats)
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    // Buscar autores únicos dos livros carregados
    setAuthors(
      Array.from(
        new Set(books.map(b => b.author).filter((a): a is string => typeof a === 'string' && !!a))
      )
    )
  }, [books])

  useEffect(() => {
    async function loadUserData() {
      if (!user) return
      try {
        const supabase = createClient()
        // Carrega tratados comprados (division_id)
        const { data: purchasedData } = await supabase
          .from('purchased_books')
          .select('division_id, expires_at')
          .eq('user_id', user.id)
        const ativos = (purchasedData || []).filter(pb => new Date(pb.expires_at) > new Date())
        setPurchasedBooks(ativos.map(pb => pb.division_id))

        // Verifica se tem assinatura ativa
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setHasActiveSubscription(
          !!subscriptionData && new Date(subscriptionData.current_period_end) > new Date()
        )
      } catch {}
    }
    loadUserData()
  }, [user])

  // Filtrar livros com base na pesquisa, categoria e autor (sem categorias)

  async function handlePurchase(divisionId: string, bookId: string) {
    if (!user) {
      router.push('/login')
      return
    }
    if (hasActiveSubscription) {
      return
    }
    setLoadingPurchase(divisionId)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env['NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK'],
          userId: user.id,
          bookId: bookId,
          divisionId: divisionId,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/dashboard`,
        }),
      })
      const data = await response.json()
      window.location.href = data.url
    } catch {}
    setLoadingPurchase(null)
  }

  if (books.length === 1) {
  }

  return (
    <DashboardAccessGuard>
      <div className="flex flex-col">
        <main className="flex-1">
          <div className="container py-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Biblioteca</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                      Explore os livros de Halachá disponíveis
                    </p>
                  </div>
                </div>

                {/* Filtros avançados */}
                <div className="mb-4 flex items-center gap-4">
                  <label htmlFor="categoria" className="text-sm font-medium">
                    Categoria:
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-56">
                      {categories.find(cat => cat.id === selectedCategory)?.name || 'Todas'}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label htmlFor="autor" className="text-sm font-medium">
                    Autor:
                  </label>
                  <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                    <SelectTrigger className="w-56">
                      {selectedAuthor === 'all' ? 'Todos' : selectedAuthor}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {authors.map(author => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-6">
                  {books.length === 1 && divisions.length > 0 && books[0] && (
                    <>
                      <h2 className="mb-4 text-center text-2xl font-bold">{books[0]?.title}</h2>
                      {books[0]?.author && (
                        <p className="mb-2 text-center text-lg text-muted-foreground">
                          {books[0]?.author}
                        </p>
                      )}
                      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2">
                        {divisions
                          .filter(div => div.book_id === books[0]?.id)
                          .sort((a, b) => a.position - b.position)
                          .map(div => {
                            const unlocked =
                              hasActiveSubscription || purchasedBooks.includes(div.id)
                            return (
                              <div
                                key={div.id}
                                className="flex flex-col items-center justify-between rounded-xl border bg-slate-50 p-8 text-center shadow-sm transition hover:shadow-md"
                              >
                                <span className="mb-2 block text-lg font-bold">{div.title}</span>
                                {div.description && (
                                  <div className="mb-4 mt-1 text-base text-gray-500">
                                    {div.description}
                                  </div>
                                )}
                                {unlocked ? (
                                  <Link
                                    href={`/livros/${books[0]?.id}/divisoes/${div.id}`}
                                    className="mb-2 inline-block rounded border border-blue-600 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
                                  >
                                    Acessar Tratado
                                  </Link>
                                ) : (
                                  <div className="flex w-full flex-col items-center gap-2">
                                    <Button
                                      className="mt-2 w-full"
                                      onClick={() => handlePurchase(div.id, books[0]?.id ?? '')}
                                      disabled={loadingPurchase === div.id || hasActiveSubscription}
                                    >
                                      {loadingPurchase === div.id ? (
                                        <div className="flex items-center justify-center">
                                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        </div>
                                      ) : (
                                        'Comprar'
                                      )}
                                    </Button>
                                    <div className="mt-2 flex items-center justify-center text-gray-400">
                                      <Lock className="mr-1 h-5 w-5" />
                                      <span>Bloqueado</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        {divisions.filter(div => div.book_id === books[0]?.id).length === 0 && (
                          <p className="text-center text-gray-500">
                            Nenhum tratado disponível para este livro.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </DashboardAccessGuard>
  )
}
