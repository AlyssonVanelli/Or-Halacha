import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { PublicShell } from '@/components/content/PublicShell'
import { SimanReader } from '@/components/content/SimanReader'
import { getSiman } from '@/lib/content/server'

// Versão pública (sem login) do siman: usada no HTML inicial e nos metadados para o Google.
// O leitor atualiza depois com o acesso do usuário logado.
const getPublicSiman = cache((simanId: string) =>
  /^[0-9a-f-]{36}$/i.test(simanId) ? getSiman(simanId, null) : Promise.resolve(null)
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ simanId: string }>
}): Promise<Metadata> {
  const { simanId } = await params
  const siman = await getPublicSiman(simanId)
  if (!siman) return { title: 'Siman não encontrado' }

  const where = siman.divisionTitle || siman.appendixType || 'Shulchan Aruch'
  const title = `${where}, Siman ${siman.number}${siman.subject ? ` — ${siman.subject}` : ''}`
  const sample = siman.seifim[0]?.text.replace(/\*+/g, '').replace(/\s+/g, ' ').trim() ?? ''
  const description = (
    sample
      ? `${sample.slice(0, 150)}${sample.length > 150 ? '…' : ''}`
      : `Shulchan Aruch em português: ${where}, Siman ${siman.number}.`
  ).slice(0, 160)

  return {
    title,
    description,
    alternates: { canonical: `/siman/${siman.id}` },
    openGraph: { title, description, url: `/siman/${siman.id}`, type: 'article' },
    twitter: { title, description },
  }
}

export default async function SimanPage({
  params,
  searchParams,
}: {
  params: Promise<{ simanId: string }>
  searchParams: Promise<{ seif?: string }>
}) {
  const { simanId } = await params
  const { seif } = await searchParams
  const initialData = await getPublicSiman(simanId)
  if (!initialData) notFound()

  const initialSeif = seif ? parseInt(seif, 10) : undefined

  return (
    <PublicShell>
      <SimanReader
        key={simanId}
        simanId={simanId}
        initialData={initialData}
        initialSeif={Number.isFinite(initialSeif) ? initialSeif : undefined}
      />
    </PublicShell>
  )
}
