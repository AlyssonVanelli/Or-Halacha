import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { PublicShell } from '@/components/content/PublicShell'
import { DivisionIndexView } from '@/components/content/DivisionIndexView'
import { DIVISION_BLURBS } from '@/lib/content/divisions'
import { getDivisionIndex } from '@/lib/content/server'

const loadIndex = cache((divisionId: string) =>
  /^[0-9a-f-]{36}$/i.test(divisionId) ? getDivisionIndex(divisionId) : Promise.resolve(null)
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ divisionId: string }>
}): Promise<Metadata> {
  const { divisionId } = await params
  const index = await loadIndex(divisionId)
  if (!index) return { title: 'Tratado não encontrado' }

  const title = `${index.title} — Shulchan Aruch em português`
  const description =
    `${DIVISION_BLURBS[index.title] || index.description || ''} ${index.simanim.length} simanim com o assunto de cada um.`.trim()
  return {
    title,
    description,
    alternates: { canonical: `/tratado/${index.id}` },
    openGraph: { title, description, url: `/tratado/${index.id}` },
  }
}

export default async function TratadoPage({ params }: { params: Promise<{ divisionId: string }> }) {
  const { divisionId } = await params
  const index = await loadIndex(divisionId)
  if (!index) notFound()

  return (
    <PublicShell>
      <DivisionIndexView key={divisionId} divisionId={divisionId} initialIndex={index} />
    </PublicShell>
  )
}
