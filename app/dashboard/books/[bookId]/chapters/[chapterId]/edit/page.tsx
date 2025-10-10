'use client'

import { useEffect, useState, useCallback } from 'react'
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

export default function EditChapterPage() {
  const params = useParams()
  const bookId = params?.['bookId'] as string
  const chapterId = params?.['chapterId'] as string
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [position, setPosition] = useState(1)
  const [isPublished, setIsPublished] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchChapterAndContent() {
      setLoading(true)
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('title, slug, position, is_published')
        .eq('id', chapterId)
        .single()
      if (chapterData) {
        setTitle(chapterData.title)
        setSlug(chapterData.slug)
        setPosition(chapterData.position)
        setIsPublished(chapterData.is_published)
      }
      const { data: contentData } = await supabase
        .from('content')
        .select('content')
        .eq('chapter_id', chapterId)
        .single()
      if (contentData) {
        setContent(contentData.content)
      }
      setLoading(false)
    }
    if (chapterId) fetchChapterAndContent()
  }, [chapterId])

  const saveContent = useCallback(async () => {
    setSaving(true)
    try {
      await supabase
        .from('chapters')
        .update({
          title,
          slug,
          position,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapterId)

      await supabase
        .from('content')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('chapter_id', chapterId)

      setLastSaved(new Date())
      toast({
        title: 'Conteúdo salvo',
        description: 'Todas as alterações foram salvas com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao tentar salvar as alterações.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [title, slug, position, isPublished, content, chapterId, toast])

  // Autosave a cada 30 segundos se houver mudanças
  useEffect(() => {
    const timer = setInterval(() => {
      if (content && !saving) {
        saveContent()
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [content, saving, saveContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveContent()
    router.push(`/dashboard/books/${bookId}/chapters`)
  }

  return (
    <AdminGuard>
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar Capítulo</h1>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Último salvamento: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button onClick={() => router.back()} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar e Sair'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
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
        )}
      </div>
    </AdminGuard>
  )
}
