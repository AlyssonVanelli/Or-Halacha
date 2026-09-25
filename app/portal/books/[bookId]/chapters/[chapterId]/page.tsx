import { redirect } from 'next/navigation'

// Rota antiga: o leitor único fica em /siman/[simanId]
export default async function LegacyChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>
}) {
  const { chapterId } = await params
  redirect(`/siman/${chapterId}`)
}
