import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ParashaSemanalProps {
  parasha: {
    nome: string
    haftarah: string
    leituraEspecial?: string
  }
}

export function ParashaSemanal({ parasha }: ParashaSemanalProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Leituras da Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full space-y-4 rounded-md border p-4">
          <div>
            <h3 className="mb-1 font-semibold">Parashá</h3>
            <p className="text-sm text-muted-foreground">{parasha.nome}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold">Haftarah</h3>
            <p className="text-sm text-muted-foreground">{parasha.haftarah}</p>
          </div>
          {parasha.leituraEspecial && (
            <div>
              <h3 className="mb-1 font-semibold">Leitura Especial</h3>
              <p className="text-sm text-muted-foreground">{parasha.leituraEspecial}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
