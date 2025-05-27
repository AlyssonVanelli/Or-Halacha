import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SimanDoDiaProps {
  siman: {
    numero: number
    titulo: string
    livro: string
    seif?: string
    tratado?: string
  }
}

export function SimanDoDia({ siman }: SimanDoDiaProps) {
  if (!siman) return null
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Siman do Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            {siman.tratado && (
              <span className="mb-1 block text-xs text-muted-foreground">{siman.tratado}</span>
            )}
            <h3 className="mb-1 font-semibold">Siman {siman.numero}</h3>
            {siman.titulo && siman.titulo !== `Siman ${siman.numero}` && (
              <p className="text-sm text-muted-foreground">{siman.titulo}</p>
            )}
          </div>
          {siman.seif && (
            <div>
              <h3 className="mb-1 font-semibold">Seif</h3>
              <p className="text-sm text-muted-foreground">{siman.seif}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
