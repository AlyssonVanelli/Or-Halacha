'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SubscriberGuard from '@/components/SubscriberGuard'

interface Chapter {
  id: string
  title: string
  slug: string
  position: number
}

interface Book {
  title: string
  author: string
}

export default function BookChaptersPage() {
  const params = useParams()
  const bookId = params?.['bookId'] as string
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookAndChapters() {
      setLoading(true)
      const { data: bookData } = await supabase
        .from('books')
        .select('title, author')
        .eq('id', bookId)
        .single()
      setBook(bookData)

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('id, title, slug, position')
        .eq('book_id', bookId)
        .eq('is_published', true)
        .order('position')
      setChapters(chaptersData || [])
      setLoading(false)
    }
    if (bookId) fetchBookAndChapters()
  }, [bookId])

  return (
    <SubscriberGuard>
      <div className="mx-auto max-w-2xl py-8">
        <Link href="/portal" className="mb-4 inline-block text-blue-600 underline">
          &larr; Voltar para livros
        </Link>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold">{book?.title}</h1>
            <p className="mb-2 text-gray-600">{book?.author}</p>
            <div className="mb-6">
              <Link
                href={`/dashboard/books/${bookId}/edit`}
                className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
              >
                ✏️ Editar Livro
              </Link>
            </div>
            <div className="grid gap-4">
              {chapters.map(chapter => (
                <Link
                  key={chapter.id}
                  href={`/portal/books/${bookId}/chapters/${chapter.id}`}
                  className="block rounded-lg border p-4 transition hover:bg-gray-50"
                >
                  <span className="font-semibold">Capítulo {chapter.position}:</span>{' '}
                  {chapter.title}
                </Link>
              ))}
              {chapters.length === 0 && (
                <div className="text-center text-gray-500">Nenhum capítulo disponível.</div>
              )}
            </div>
          </>
        )}
      </div>
    </SubscriberGuard>
  )
}
