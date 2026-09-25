import { redirect } from 'next/navigation'

// Rota antiga: os apêndices aparecem no índice do tratado (/tratado/[divisionId])
export default async function LegacyAppendixPage({
  params,
}: {
  params: Promise<{ divisaoId: string }>
}) {
  const { divisaoId } = await params
  redirect(`/tratado/${divisaoId}`)
}
