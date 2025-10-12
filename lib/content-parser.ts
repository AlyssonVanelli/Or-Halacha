/**
 * Parser inteligente para organizar conteúdo dos simanim
 * Sem mexer no banco de dados - apenas estrutura o conteúdo existente
 */

export interface ParsedSeif {
  id: string
  position: number
  title: string
  content: string
  topics: string[]
  summary: string
}

export interface ParsedSiman {
  id: string
  title: string
  position: number
  seifim: ParsedSeif[]
  topics: string[]
  summary: string
}

/**
 * Extrai tópicos/assuntos de um texto
 */
function extractTopics(text: string): string[] {
  const topics: string[] = []

  // Padrões comuns para identificar tópicos
  const topicPatterns = [
    // Tópicos com "**" (negrito)
    /\*\*([^*]+)\*\*/g,
    // Tópicos com números (1., 2., etc.)
    /^\d+\.\s*([^:]+):/gm,
    // Tópicos com "•" ou "-"
    /^[•\-]\s*([^:]+):/gm,
    // Tópicos em maiúsculas
    /^([A-Z][A-Z\s]+):/gm,
    // Tópicos com "Contém" ou "Inclui"
    /(?:Contém|Inclui|Trata|Aborda)\s+([^.]*)/gi,
  ]

  topicPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const topic = match.replace(pattern, '$1').trim()
        if (topic.length > 3 && topic.length < 100) {
          topics.push(topic)
        }
      })
    }
  })

  // Remove duplicatas e limpa
  return Array.from(new Set(topics)).filter(
    topic => topic.length > 3 && !topic.includes('**') && !topic.match(/^\d+$/)
  )
}

/**
 * Gera um resumo do conteúdo
 */
function generateSummary(text: string, maxLength: number = 200): string {
  // Remove formatação markdown
  const cleanText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/^\d+\.\s*/gm, '')
    .trim()

  // Pega as primeiras frases
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10)

  if (sentences.length === 0) return cleanText.substring(0, maxLength) + '...'

  let summary = ''
  for (const sentence of sentences) {
    if (summary.length + sentence.length > maxLength) break
    summary += sentence.trim() + '. '
  }

  return summary.trim().substring(0, maxLength) + (summary.length > maxLength ? '...' : '')
}

/**
 * Identifica seifim automaticamente no texto
 */
function identifySeifim(content: string): ParsedSeif[] {
  const seifim: ParsedSeif[] = []

  // Padrões para identificar seifim (em ordem de prioridade)
  const seifPatterns = [
    // Padrão: "**Seif 1**", "**Seif 2**", etc. (mais específico)
    /\*\*Seif\s+(\d+)\*\*[:\s]*([^\n]*)\n([\s\S]*?)(?=\*\*Seif\s+\d+\*\*|$)/gi,
    // Padrão: "Seif 1:", "Seif 2:", etc.
    /Seif\s+(\d+)[:\.]?\s*([^\n]*)\n([\s\S]*?)(?=Seif\s+\d+[:\.]|$)/gi,
    // Padrão: "1.", "2.", etc. (numeração simples)
    /^(\d+)\.\s*([^\n]*)\n([\s\S]*?)(?=^\d+\.|$)/gm,
  ]

  let position = 1

  for (const pattern of seifPatterns) {
    const matches = content.match(pattern)
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        const execResult = pattern.exec(match)
        if (execResult) {
          const seifNumber = parseInt(execResult[1]) || position
          const rawTitle = execResult[2]?.trim()

          // Criar título mais limpo e descritivo
          let title = rawTitle
          if (!title || title.length < 3) {
            // Se não tem título, usar apenas o número
            title = `${seifNumber}`
          } else {
            // Limpar título se for muito genérico
            if (title.toLowerCase().includes('seif') || title.match(/^\d+$/)) {
              title = `${seifNumber}`
            } else {
              // Manter o título original se for descritivo
              title = title.replace(/^Seif\s+\d+[:\.]?\s*/i, '').trim()
              if (!title) {
                title = `${seifNumber}`
              }
            }
          }

          const content = execResult[3]?.trim() || match

          if (content.length > 20) {
            // Só adiciona se tiver conteúdo suficiente
            seifim.push({
              id: `seif-${seifNumber}`,
              position: seifNumber,
              title,
              content,
              topics: extractTopics(content),
              summary: generateSummary(content, 150),
            })
            position++
          }
        }
      })
      break // Usa o primeiro padrão que funcionar
    }
  }

  // Se não encontrou seifim estruturados, cria um único seif com todo o conteúdo
  if (seifim.length === 0) {
    seifim.push({
      id: 'seif-1',
      position: 1,
      title: 'Conteúdo',
      content,
      topics: extractTopics(content),
      summary: generateSummary(content, 200),
    })
  }

  return seifim
}

/**
 * Parse principal - organiza um siman completo
 */
export function parseSimanContent(
  simanId: string,
  simanTitle: string,
  simanPosition: number,
  rawContent: string
): ParsedSiman {
  console.log('🔍 PARSING SIMAN:', { simanId, simanTitle, simanPosition })

  // Identifica seifim automaticamente
  const seifim = identifySeifim(rawContent)

  console.log('📚 SEIFIM IDENTIFICADOS:', seifim.length)

  // Extrai todos os tópicos do siman
  const allTopics = seifim.flatMap(seif => seif.topics)
  const uniqueTopics = Array.from(new Set(allTopics))

  // Gera resumo geral
  const generalSummary = generateSummary(rawContent, 300)

  const parsedSiman: ParsedSiman = {
    id: simanId,
    title: simanTitle,
    position: simanPosition,
    seifim,
    topics: uniqueTopics,
    summary: generalSummary,
  }

  console.log('✅ SIMAN PARSED:', {
    seifimCount: seifim.length,
    topicsCount: uniqueTopics.length,
    summary: generalSummary.substring(0, 100) + '...',
  })

  return parsedSiman
}

/**
 * Hook para usar o parser no frontend
 */
export function useContentParser() {
  return {
    parseSimanContent,
    extractTopics,
    generateSummary,
  }
}
