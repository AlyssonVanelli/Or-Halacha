import { PublicShell } from '@/components/content/PublicShell'
import { SimanReader } from '@/components/content/SimanReader'

export default async function SimanPage({
  params,
  searchParams,
}: {
  params: Promise<{ simanId: string }>
  searchParams: Promise<{ seif?: string }>
}) {
  const { simanId } = await params
  const { seif } = await searchParams
  const initialSeif = seif ? parseInt(seif, 10) : undefined

  return (
    <PublicShell>
      <SimanReader
        simanId={simanId}
        initialSeif={Number.isFinite(initialSeif) ? initialSeif : undefined}
      />
    </PublicShell>
  )
}
