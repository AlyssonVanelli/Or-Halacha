'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SubscriberGuard from '@/components/SubscriberGuard'

interface Chapter {
  title: string
  position: number
}

interface Content {
  content: string
}

export default function ChapterContentPage() {
  const params = useParams()
  const bookId = params?.['bookId'] as string
  const chapterId = params?.['chapterId'] as string
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChapterAndContent() {
      setLoading(true)
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('title, position')
        .eq('id', chapterId)
        .single()
      setChapter(chapterData)

      const { data: contentData } = await supabase
        .from('content')
        .select('content')
        .eq('chapter_id', chapterId)
        .single()
      setContent(contentData)
      setLoading(false)
    }
    if (chapterId) fetchChapterAndContent()
  }, [chapterId])

  return (
    <SubscriberGuard>
      <div className="mx-auto max-w-2xl py-8">
        <Link
          href={`/portal/books/${bookId}`}
          className="mb-4 inline-block text-blue-600 underline"
        >
          &larr; Voltar para capítulos
        </Link>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold">
              Capítulo {chapter?.position}: {chapter?.title}
            </h1>
            <div className="mb-6">
              <Link
                href={`/dashboard/books/${bookId}/chapters/${chapterId}/edit`}
                className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
              >
                ✏️ Editar Capítulo
              </Link>
            </div>
            <div
              className="prose prose-lg mt-6"
              dangerouslySetInnerHTML={{
                __html: content?.content || '<p>Conteúdo não encontrado.</p>',
              }}
            />
          </>
        )}
      </div>
    </SubscriberGuard>
  )
}
