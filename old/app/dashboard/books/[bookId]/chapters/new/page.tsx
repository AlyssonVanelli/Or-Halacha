'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AdminGuard from '@/components/AdminGuard'

export default function NewChapterPage() {
  const params = useParams()
  const bookId = params?.['bookId'] as string
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [position, setPosition] = useState(1)
  const [isPublished, setIsPublished] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Função para gerar slug a partir do título
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  // Atualiza o slug quando o título muda
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setSlug(generateSlug(newTitle))
  }

  const saveChapter = useCallback(async () => {
    setSaving(true)
    try {
      // Primeiro, insere o capítulo
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          book_id: bookId,
          title,
          slug,
          position,
          is_published: isPublished,
        })
        .select()
        .single()

      if (chapterError) throw chapterError

      // Depois, insere o conteúdo
      const { error: contentError } = await supabase.from('content').insert({
        chapter_id: chapterData.id,
        content,
      })

      if (contentError) throw contentError

      toast({
        title: 'Capítulo criado',
        description: 'O capítulo foi criado com sucesso.',
      })

      // Redireciona para a lista de capítulos
      router.push(`/dashboard/books/${bookId}/chapters`)
    } catch (error) {
      toast({
        title: 'Erro ao criar',
        description: 'Ocorreu um erro ao tentar criar o capítulo.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [title, slug, position, isPublished, content, bookId, router, toast])

  return (
    <AdminGuard>
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Novo Capítulo</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="outline">
              Cancelar
            </Button>
            <Button onClick={saveChapter} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={handleTitleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Posição</Label>
              <Input
                id="position"
                type="number"
                value={position}
                onChange={e => setPosition(Number(e.target.value))}
                required
                min={1}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={isPublished}
                onCheckedChange={checked => setIsPublished(checked as boolean)}
              />
              <Label htmlFor="published">Publicado</Label>
            </div>
          </div>

          <Tabs defaultValue="edit">
            <TabsList className="mb-4">
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <RichTextEditor content={content} onChange={setContent} />
            </TabsContent>

            <TabsContent value="preview">
              <div
                className="prose prose-lg max-w-none rounded-lg border bg-white p-4"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  )
}
