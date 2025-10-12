import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { RichTextEditor } from '../components/ui/rich-text-editor'

// Mock do useEditor para disparar onChange
vi.mock('@tiptap/react', () => {
  const actual = vi.importActual('@tiptap/react')
  return {
    ...actual,
    useEditor: (config: any) => {
      setTimeout(() => {
        config.onUpdate({ editor: { getHTML: () => '<p>Novo conteúdo</p>' } })
      }, 0)
      return { commands: {}, getHTML: () => '<p>Novo conteúdo</p>' }
    },
    EditorContent: ({ editor }: any) => <div data-testid="editor-content" />,
  }
})

describe('RichTextEditor', () => {
  it('renderiza sem erros', () => {
    const onChange = vi.fn()
    render(<RichTextEditor content="<p>Teste</p>" onChange={onChange} />)
  })

  it('chama onChange quando o conteúdo é alterado', async () => {
    const onChange = vi.fn()
    render(<RichTextEditor content="<p>Teste</p>" onChange={onChange} />)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(onChange).toHaveBeenCalled()
  })

  it('aplica classes CSS personalizadas', () => {
    const { container } = render(
      <RichTextEditor content="<p>Teste</p>" onChange={() => {}} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})

// Este teste foi comentado pois não existe um componente RichTextEditor exportado em ../components/RichTextEditor.
