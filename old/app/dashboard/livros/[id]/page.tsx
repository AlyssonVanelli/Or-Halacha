'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AdminGuard from '@/components/AdminGuard'
import { supabase } from '@/lib/supabase'
import type { Book, Chapter } from '../../../types'

export default function BookPage() {
  const params = useParams()
  const bookId = (params && params['id']) as string | undefined
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('')

  useEffect(() => {
    if (!bookId) return
    async function fetchBookAndChapters() {
      setLoading(true)
      const { data: bookData } = await supabase
        .from('books')
        .select('id, title, category, description, author')
        .eq('id', bookId)
        .single()
      setBook(
        bookData
          ? {
              ...bookData,
              description: bookData.description || '',
              author: bookData.author || '',
              divisions: [],
            }
          : null
      )

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('id, title, position, slug, content')
        .eq('book_id', bookId)
        .order('position')
      setChapters(
        (chaptersData || []).map(
          (c: Record<string, unknown>) =>
            ({
              ...c,
              id: Number(c['id']),
              slug: typeof c['slug'] === 'string' ? c['slug'] : '',
              content: typeof c['content'] === 'string' ? c['content'] : '',
            }) as Chapter
        )
      )
      if (chaptersData && chaptersData.length > 0 && chaptersData[0] && chaptersData[0]['id']) {
        setActiveTab(`chapter-${chaptersData[0]['id']}`)
      } else {
        setActiveTab('')
      }
      setLoading(false)
    }
    fetchBookAndChapters()
  }, [bookId])

  if (!bookId) return <div>Parâmetros inválidos</div>

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <AdminGuard>
      <div className="flex flex-col">
        <main className="flex-1">
          <div className="container max-w-4xl px-4 py-8 md:px-6">
            <div className="mb-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar para a Biblioteca
              </Link>
            </div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">{book?.title}</h1>
              <p className="text-gray-500 dark:text-gray-400">{book?.category}</p>
              <div className="mb-4 flex justify-end">
                <Link href={`/dashboard/books/${bookId}/edit`}>
                  <Button variant="default" className="flex items-center gap-2">
                    ✏️ Editar Livro
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mb-8 grid gap-4">
              {chapters.map(chapter => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition hover:bg-gray-50"
                >
                  <span className="flex-1 font-semibold">
                    Capítulo {chapter.position}: {chapter.title}
                  </span>
                  <Link
                    href={`/livros/${bookId}/capitulos/${chapter.id}/edit`}
                    className="ml-4 inline-flex items-center rounded bg-blue-600 px-3 py-1 text-white shadow hover:bg-blue-700"
                  >
                    ✏️ Editar Capítulo
                  </Link>
                </div>
              ))}
              {chapters.length === 0 && (
                <div className="text-center text-gray-500">Nenhum capítulo disponível.</div>
              )}
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full justify-start overflow-auto">
                {chapters.map(chapter => (
                  <TabsTrigger key={chapter.id} value={`chapter-${chapter.id}`}>
                    {chapter.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {chapters.map(chapter => (
                <TabsContent key={chapter.id} value={`chapter-${chapter.id}`} className="space-y-4">
                  <div className="rounded-lg border bg-white p-6 dark:bg-slate-950">
                    <h2 className="mb-4 text-2xl font-bold">{chapter.title}</h2>
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: chapter.content || '' }}
                    />
                    <div className="mt-6 flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Adicionar aos favoritos
                      </Button>
                      <div className="flex gap-2">
                        {chapter.id > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab(`chapter-${chapter.id - 1}`)}
                          >
                            Anterior
                          </Button>
                        )}
                        {chapter.id < chapters.length && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setActiveTab(`chapter-${chapter.id + 1}`)}
                          >
                            Próximo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}
