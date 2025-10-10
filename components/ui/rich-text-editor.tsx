'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
}

export function RichTextEditor({ content, onChange, className, ...props }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className={cn('prose prose-sm max-w-none', className)} {...props}>
      <EditorContent editor={editor} />
    </div>
  )
}
