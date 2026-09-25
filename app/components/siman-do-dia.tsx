import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RichText } from '@/components/content/RichText'

export interface SimanDoDiaData {
  simanId: string
  numero: number
  tratado: string | null
  assunto: string
  totalSeifim: number
  seifim: Array<{ number: number; text: string }>
}

export function SimanDoDia({ siman }: { siman: SimanDoDiaData | null }) {
  if (!siman) return null
  return (
    <Card className="w-full border-0 bg-white shadow-lg">
      <CardHeader className="rounded-t-lg bg-gradient-to-r from-amber-600 to-orange-600 pb-4 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
          Siman do dia: leitura grátis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {siman.tratado ? `${siman.tratado} · ` : ''}Siman {siman.numero}
          </p>
          {siman.assunto && (
            <h3 className="mt-1 text-lg font-semibold leading-snug text-gray-900">
              {siman.assunto}
            </h3>
          )}
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-gray-700">
          {siman.seifim.map(s => (
            <div key={s.number} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                {s.number}
              </span>
              <RichText text={s.text} className="line-clamp-5" />
            </div>
          ))}
        </div>

        <Button
          asChild
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          <Link href={`/siman/${siman.simanId}`}>
            {siman.totalSeifim > siman.seifim.length
              ? `Ler os ${siman.totalSeifim} seifim de hoje`
              : 'Abrir o siman de hoje'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="text-center text-xs text-gray-500">Sem cadastro. Um siman novo todo dia.</p>
      </CardContent>
    </Card>
  )
}
