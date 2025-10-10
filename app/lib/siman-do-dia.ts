import { createClient } from '@/lib/supabase/server'

function cleanSimanContent(text: string, simanNumber?: string): { title: string; content: string } {
  if (!text) return { title: '', content: '' }

  // 1. Remove all occurrences of double asterisks (**)
  text = text.replace(/\*\*/g, '')

  // 2. Remove siman number repetition at the beginning of content
  if (simanNumber) {
    const simanPatterns = [
      new RegExp(`^SIMAN\\s+${simanNumber}\\s*`, 'gi'),
      new RegExp(`^Siman\\s+${simanNumber}\\s*`, 'gi'),
      new RegExp(`^${simanNumber}\\s*`, 'gi'),
    ]

    simanPatterns.forEach(pattern => {
      text = text.replace(pattern, '')
    })
  }

  // 3. Extract title (question) and content
  let title = ''
  let content = text

  // Look for various question patterns that commonly appear in simanim
  const titlePatterns = [
    // Como proceder patterns
    /^([^.]*como\s+se\s+deve\s+proceder[^.]*\.)/i,
    /^([^.]*como\s+proceder[^.]*\.)/i,
    /^([^.]*como\s+deve\s+proceder[^.]*\.)/i,
    /^([^.]*como\s+se\s+procede[^.]*\.)/i,

    // O que fazer patterns
    /^([^.]*o\s+que\s+fazer[^.]*\.)/i,
    /^([^.]*o\s+que\s+se\s+faz[^.]*\.)/i,
    /^([^.]*o\s+que\s+deve\s+fazer[^.]*\.)/i,

    // Quando patterns
    /^([^.]*quando\s+[^.]*\.)/i,

    // Se patterns (conditional questions)
    /^([^.]*se\s+[^.]*\?[^.]*\.)/i,

    // Qual patterns
    /^([^.]*qual\s+[^.]*\.)/i,

    // Em que patterns
    /^([^.]*em\s+que\s+[^.]*\.)/i,

    // De que forma patterns
    /^([^.]*de\s+que\s+forma[^.]*\.)/i,
    /^([^.]*de\s+que\s+maneira[^.]*\.)/i,

    // Se deve patterns
    /^([^.]*se\s+deve\s+[^.]*\.)/i,

    // Como se patterns
    /^([^.]*como\s+se\s+[^.]*\.)/i,

    // O que acontece patterns
    /^([^.]*o\s+que\s+acontece[^.]*\.)/i,

    // Se é patterns
    /^([^.]*se\s+é\s+[^.]*\.)/i,

    // General question patterns (ending with ?)
    /^([^?]*\?[^.]*\.)/i,

    // If the first sentence is very short and seems like a question/title
    /^([^.]{10,80}\.)/i,
  ]

  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match) {
      const potentialTitle = match[1].trim()
      // Only use as title if it's not too long and seems like a question/title
      if (
        potentialTitle.length <= 100 &&
        (potentialTitle.includes('?') ||
          potentialTitle.includes('como') ||
          potentialTitle.includes('o que') ||
          potentialTitle.includes('quando') ||
          potentialTitle.includes('qual') ||
          potentialTitle.includes('se ') ||
          potentialTitle.includes('de que'))
      ) {
        title = potentialTitle
        content = text.replace(pattern, '').trim()
        break
      }
    }
  }

  // 4. Remove paragraph count indicators from content
  const paragraphPatterns = [
    /E contém \d+ parágrafo[s]?:?/gi,
    /E contém um parágrafo:?/gi,
    /E contém \d+ seif[im]?:?/gi,
    /E contém um seif:?/gi,
    /Contém \d+ parágrafo[s]?:?/gi,
    /Contém um parágrafo:?/gi,
    /Contém \d+ seif[im]?:?/gi,
    /Contém um seif:?/gi,
    /E tem \d+ parágrafo[s]?:?/gi,
    /E tem um parágrafo:?/gi,
    /E tem \d+ seif[im]?:?/gi,
    /E tem um seif:?/gi,
    /Tem \d+ parágrafo[s]?:?/gi,
    /Tem um parágrafo:?/gi,
    /Tem \d+ seif[im]?:?/gi,
    /Tem um seif:?/gi,
    /E inclui \d+ parágrafo[s]?:?/gi,
    /E inclui um parágrafo:?/gi,
    /E inclui \d+ seif[im]?:?/gi,
    /E inclui um seif:?/gi,
    /Inclui \d+ parágrafo[s]?:?/gi,
    /Inclui um parágrafo:?/gi,
    /Inclui \d+ seif[im]?:?/gi,
    /Inclui um seif:?/gi,
  ]

  paragraphPatterns.forEach(pattern => {
    content = content.replace(pattern, '')
  })

  // 5. Clean up any double spaces but preserve line breaks
  content = content.replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
  content = content.replace(/\n\s*\n/g, '\n') // Remove empty lines

  // 6. Convert all-caps phrases/sentences to sentence case, line by line
  const processLineForCase = (line: string): string => {
    const trimmedLine = line.trim()
    // Check if the line is entirely uppercase (and not just numbers/symbols)
    if (
      trimmedLine.length > 0 &&
      trimmedLine === trimmedLine.toUpperCase() &&
      trimmedLine !== trimmedLine.toLowerCase()
    ) {
      // Convert to sentence case: first letter uppercase, rest lowercase
      return trimmedLine.charAt(0).toUpperCase() + trimmedLine.slice(1).toLowerCase()
    }
    return line // Return as is if not all uppercase
  }

  const lines = content.split('\n')
  const processedLines = lines.map(processLineForCase)
  content = processedLines.join('\n')

  return { title, content }
}

export async function getSimanDoDia() {
  const supabase = await createClient()
  const hoje = new Date().toISOString().slice(0, 10)

  // Busca o siman do dia na tabela
  const { data, error } = await supabase
    .from('siman_do_dia')
    .select('numero, titulo, livro, seif, siman_id, tratado')
    .eq('data', hoje)
    .single()

  if (error) {
    return null
  }

  if (!data) return null

  // Busca o conteúdo completo do siman
  const { data: contentData } = await supabase
    .from('content')
    .select('content')
    .eq('chapter_id', data.siman_id)
    .single()

  // Se há conteúdo, sempre cria um preview limitado cortando no meio
  let preview: string | null = null
  let isPreview = false
  let extractedTitle = ''

  if (contentData?.content) {
    const { title, content } = cleanSimanContent(contentData.content, data.numero)
    extractedTitle = title
    const contentLength = content.length

    if (contentLength > 200) {
      // Procura pelo primeiro seif completo para mostrar
      const seifPattern = /(\d+\.\s+[^.]*\.)/g
      const matches = content.match(seifPattern)
      
      if (matches && matches.length > 0) {
        // Pega apenas o primeiro seif completo
        const firstSeif = matches[0]
        preview = firstSeif
        isPreview = true
      } else {
        // Se não encontrar padrão de seif, corta em uma frase completa
        const sentences = content.split(/[.!?]+/)
        if (sentences.length > 1) {
          preview = sentences[0] + '.'
          isPreview = true
        } else {
          preview = content
          isPreview = true
        }
      }
    } else {
      // Mesmo com conteúdo curto, ainda mostra como preview na home
      preview = content
      isPreview = true
    }
  }

  return {
    numero: data.numero,
    titulo: data.titulo,
    livro: data.livro,
    seif: data.seif,
    siman_id: data.siman_id,
    tratado: data.tratado,
    conteudo: preview || undefined,
    extractedTitle: extractedTitle || undefined,
    isPreview,
  }
}
