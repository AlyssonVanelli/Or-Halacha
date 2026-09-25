import { redirect } from 'next/navigation'

// Rota antiga: o leitor único fica em /siman/[simanId]
export default async function LegacySimanPage({
  params,
  searchParams,
}: {
  params: Promise<{ simanId: string }>
  searchParams: Promise<{ seif?: string }>
}) {
  const { simanId } = await params
  const { seif } = await searchParams
  redirect(`/siman/${simanId}${seif ? `?seif=${encodeURIComponent(seif)}` : ''}`)
}
