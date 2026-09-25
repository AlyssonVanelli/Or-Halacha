import { createAdminClient } from '@/lib/supabase/admin'
import { getSiman, todayBR } from '@/lib/content/server'

// Siman gratuito do dia: o texto completo é liberado para todos (inclusive sem login)
// na página /siman/[id]. Aqui devolvemos o resumo exibido na home.
export async function getSimanDoDia() {
  const { data } = await createAdminClient()
    .from('siman_do_dia')
    .select('siman_id')
    .eq('data', todayBR())
    .maybeSingle()

  if (!data?.siman_id) return null

  const siman = await getSiman(data.siman_id as string, null)
  if (!siman || siman.translationPending) return null

  return {
    simanId: siman.id,
    numero: siman.number,
    tratado: siman.divisionTitle || siman.appendixType,
    assunto: siman.subject,
    totalSeifim: siman.totalSeifim,
    seifim: siman.seifim.slice(0, 2).map(s => ({ number: s.number, text: s.text })),
  }
}
