import { createClient } from '@/lib/supabase/server'

export async function getSimanDoDia() {
  const supabase = createClient()
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

  return {
    numero: data.numero,
    titulo: data.titulo,
    livro: data.livro,
    seif: data.seif,
    siman_id: data.siman_id,
    tratado: data.tratado,
  }
}
