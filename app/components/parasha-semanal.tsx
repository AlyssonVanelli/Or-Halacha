import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ParashaSemanalProps {
  parasha: {
    nome: string
    haftarah: string
    leituraEspecial?: string
    parashaName?: string
  }
}

export function ParashaSemanal({ parasha }: ParashaSemanalProps) {
  // Separar as leituras diárias em linhas individuais
  const dailyReadings = parasha.nome.split('\n').filter(line => line.trim())

  return (
    <Card className="w-full border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700 pb-4 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
          Leituras da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parasha.leituraEspecial && (
          <div className="rounded-lg border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              Leitura Especial
            </h3>
            <p className="text-xs font-medium text-blue-700">{parasha.leituraEspecial}</p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-base font-semibold">
            Parashá {parasha.parashaName && `(${parasha.parashaName})`}
          </h3>
          <div className="space-y-2">
            {dailyReadings.map((reading, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 rounded-lg border border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50 p-3 shadow-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md"
              >
                <div className="flex-shrink-0">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm"></div>
                </div>
                <p className="text-xs font-medium leading-relaxed text-gray-700">{reading}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            Haftarah
          </h3>
          <p className="text-xs font-medium text-green-700">{parasha.haftarah}</p>
        </div>
      </CardContent>
    </Card>
  )
}
