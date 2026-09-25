import { PublicShell } from '@/components/content/PublicShell'
import { DivisionIndexView } from '@/components/content/DivisionIndexView'

export default async function TratadoPage({ params }: { params: Promise<{ divisionId: string }> }) {
  const { divisionId } = await params
  return (
    <PublicShell>
      <DivisionIndexView divisionId={divisionId} />
    </PublicShell>
  )
}
