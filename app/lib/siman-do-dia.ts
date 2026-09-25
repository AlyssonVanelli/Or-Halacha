import { getSiman, getSimanDoDiaId } from '@/lib/content/server'

// Siman gratuito do dia: o texto completo é liberado para todos (inclusive sem login)
// na página /siman/[id]. Aqui devolvemos o resumo exibido na home.
export async function getSimanDoDia() {
  const simanId = await getSimanDoDiaId()
  if (!simanId) return null

  const siman = await getSiman(simanId, null)
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
