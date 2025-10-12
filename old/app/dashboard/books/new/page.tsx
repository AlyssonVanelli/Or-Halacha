'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminGuard from '@/components/AdminGuard'

export default function NewBookPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('books').insert([
      {
        title,
        slug,
        description,
        author,
        is_published: isPublished,
      },
    ])
    setLoading(false)
    router.push('/dashboard/books')
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-xl py-8">
        <h1 className="mb-4 text-2xl font-bold">Novo Livro</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Título</label>
            <input
              className="w-full rounded border p-2"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium">Slug</label>
            <input
              className="w-full rounded border p-2"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium">Descrição</label>
            <textarea
              className="w-full rounded border p-2"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium">Autor</label>
            <input
              className="w-full rounded border p-2"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
              />
              <span className="ml-2">Publicado</span>
            </label>
          </div>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </AdminGuard>
  )
}
