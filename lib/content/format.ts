// Funções puras de formatação de conteúdo (usadas no servidor e no cliente).

/** Remove o "1. " do início do texto de um seif (o número já é exibido à parte). */
export function stripSeifNumber(text: string): string {
  return text.replace(/^\s*\d+\.\s*/, '').trim()
}

/**
 * Extrai o assunto de um siman a partir do texto corrido da tabela `content`.
 * Ex.: "SIMAN 1\n\n**Lei do despertar matutino. Contém nove seções:**\n\n1. ..." →
 *      "Lei do despertar matutino"
 */
export function extractSubject(raw: string | null | undefined): string {
  if (!raw) return ''
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  // Ignora o cabeçalho "SIMAN N"
  const start = lines[0] && /^siman\s+\d+/i.test(lines[0]) ? 1 : 0
  const line = lines[start]
  if (!line || /^\d+\.\s/.test(line)) return ''

  const subject = line
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .split(
      /[.,;:]?\s*(?:e\s+)?(?:cont[ée]m|tem|inclui)\s+(?:\d+|um|uma|dois|duas|tr[êe]s|quatro|cinco|seis|sete|oito|nove|dez|[a-zà-ú]+)\s+(?:se[çc][õo]es|se[çc][ãa]o|seif|seifim|par[áa]grafos?)/i
    )[0]
    ?.replace(/[.:;,\s]+$/, '')
    .trim()

  if (!subject || subject.length > 160) return ''
  return subject.charAt(0).toUpperCase() + subject.slice(1)
}

/** Divide o texto corrido de um siman em seifim numerados (fallback quando não há `sections`). */
export function splitIntoSeifim(raw: string): Array<{ number: number; text: string }> {
  const body = raw.replace(/^\s*siman\s+\d+\s*/i, '')
  const seifim: Array<{ number: number; text: string }> = []
  const regex = /(?:^|\n)\s*(\d+)\.\s/g
  let match: RegExpExecArray | null
  let lastIndex = -1
  let lastNumber = 0

  while ((match = regex.exec(body)) !== null) {
    if (lastIndex >= 0) {
      const text = body.slice(lastIndex, match.index).trim()
      if (text) seifim.push({ number: lastNumber, text })
    }
    lastNumber = parseInt(match[1] ?? '0', 10)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex >= 0) {
    const text = body.slice(lastIndex).trim()
    if (text) seifim.push({ number: lastNumber, text })
  }

  if (seifim.length === 0) {
    body
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p && !/^\*\*.*\*\*$/.test(p))
      .forEach((text, idx) => seifim.push({ number: idx + 1, text }))
  }
  return seifim
}

/**
 * Versão sem acento e minúscula, com o MESMO comprimento do texto original
 * (cada caractere vira exatamente um), para localizar/destacar termos buscados.
 */
export function foldForSearch(text: string): string {
  let out = ''
  for (const ch of text) {
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    out +=
      ch.length === 1 && base.length === 1 ? base : ch.length === 1 ? ch : ' '.repeat(ch.length)
  }
  return out
}

/** Posição do termo no texto ignorando acentos e maiúsculas (-1 se não achar). */
export function findFolded(text: string, term: string): number {
  return foldForSearch(text).indexOf(foldForSearch(term.trim()))
}

/** "Siman 001 (Seder HaGet)" → número 1 */
export function simanNumber(title: string | null | undefined, position?: number | null): number {
  const m = title?.match(/(\d+)/)
  if (m?.[1]) return parseInt(m[1], 10)
  return position ?? 0
}
