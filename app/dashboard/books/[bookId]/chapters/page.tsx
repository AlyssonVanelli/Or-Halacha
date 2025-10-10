'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminGuard from '@/components/AdminGuard'

interface Chapter {
  id: string
  title: string
  slug: string
  position: number
  is_published: boolean
}

interface Book {
  id: string
  title: string
  author: string
}

export default function DashboardBookChaptersPage() {
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
        .select('id, title, author')
        .eq('id', bookId)
        .single()
      setBook(bookData)

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('id, title, slug, position, is_published')
        .eq('book_id', bookId)
        .order('position')
      setChapters(chaptersData || [])
      setLoading(false)
    }
    if (bookId) fetchBookAndChapters()
  }, [bookId])

  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="mb-4 text-2xl font-bold">Capítulos do livro: {book?.title}</h1>
        <Link
          href={`/dashboard/books/${bookId}/chapters/new`}
          className="mb-4 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Novo Capítulo
        </Link>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <table className="mt-4 w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Título</th>
                <th className="p-2 text-left">Publicado?</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map(chapter => (
                <tr key={chapter.id} className="border-t">
                  <td className="p-2">{chapter.position}</td>
                  <td className="p-2">{chapter.title}</td>
                  <td className="p-2">{chapter.is_published ? 'Sim' : 'Não'}</td>
                  <td className="p-2">
                    <Link
                      href={`/dashboard/books/${bookId}/chapters/${chapter.id}/edit`}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminGuard>
  )
}
