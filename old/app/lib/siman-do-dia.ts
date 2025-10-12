import { createClient } from '@/lib/supabase/server'

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

  // Se há conteúdo, cria um preview balanceado (3 linhas)
  let preview: string | null = null
  let isPreview = false
  if (contentData?.content) {
    const lines = contentData.content.split('\n').filter((line: string) => line.trim())
    if (lines.length > 3) {
      // Pega as primeiras 3 linhas para um preview balanceado
      const previewLines = lines.slice(0, 3)
      preview = previewLines.join('\n') + '\n...'
      isPreview = true
    } else {
      preview = contentData.content
      isPreview = false
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
    isPreview,
  }
}
