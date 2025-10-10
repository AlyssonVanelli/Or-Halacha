import { safeHTML } from '@/lib/security'

interface SafeHTMLProps {
  content: string
  className?: string
  maxLength?: number
}

/**
 * Componente seguro para renderizar HTML sanitizado
 */
export function SafeHTML({ content, className, maxLength = 10000 }: SafeHTMLProps) {
  if (!content) return null

  // Trunca conteúdo se muito longo
  const truncatedContent =
    content.length > maxLength ? content.substring(0, maxLength) + '...' : content

  const sanitizedContent = safeHTML(truncatedContent)

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
}

/**
 * Componente para texto simples com quebras de linha
 */
export function SafeText({ content, className }: { content: string; className?: string }) {
  if (!content) return null

  const sanitizedContent = safeHTML(content)

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
}
