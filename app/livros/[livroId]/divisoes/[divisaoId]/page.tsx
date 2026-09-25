import { redirect } from 'next/navigation'

// Rota antiga: o índice do tratado fica em /tratado/[divisionId]
export default async function LegacyDivisaoPage({
  params,
}: {
  params: Promise<{ divisaoId: string }>
}) {
  const { divisaoId } = await params
  redirect(`/tratado/${divisaoId}`)
}
