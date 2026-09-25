import { Fragment, type ReactNode } from 'react'

// Renderiza o markdown simples usado no conteúdo (**negrito**, *itálico*, listas "- ")
// sem dangerouslySetInnerHTML. Trechos "*Nota: ...*" são as glosas do Rema.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const key = `${keyPrefix}-${i++}`
    if (match[1] !== undefined) {
      nodes.push(<strong key={key}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      const inner = match[2]
      const note = inner.match(/^\s*(Nota|Hagah|Hagá)\s*:\s*([\s\S]*)$/i)
      nodes.push(
        note ? (
          <span
            key={key}
            className="my-1 block rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-[0.95em] text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
          >
            <abbr
              title="Glosa do Rema (Rabi Moshe Isserles), que registra o costume asquenazita"
              className="mr-1 font-semibold not-italic no-underline"
            >
              Nota do Rema:
            </abbr>
            {note[2]}
          </span>
        ) : (
          <em key={key}>{inner}</em>
        )
      )
    }
    last = regex.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean)

  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').map(l => l.trim())
        const isList = lines.every(l => /^[-•]\s+/.test(l))
        if (isList) {
          return (
            <ul key={bi} className="my-2 list-disc space-y-1 pl-6">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^[-•]\s+/, ''), `${bi}-${li}`)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={bi} className="my-2 first:mt-0 last:mb-0">
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {/^[-•]\s+/.test(l) ? '• ' : ''}
                {renderInline(l.replace(/^[-•]\s+/, ''), `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
