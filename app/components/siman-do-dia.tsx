import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface SimanDoDiaProps {
  siman: {
    numero: number
    titulo: string
    livro: string
    seif?: string
    tratado?: string
    conteudo?: string
    extractedTitle?: string
    isPreview?: boolean
  }
}

export function SimanDoDia({ siman }: SimanDoDiaProps) {
  if (!siman) return null
  return (
    <Card className="w-full border-0 bg-gradient-to-br from-white to-amber-50/30 shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader className="rounded-t-lg bg-gradient-to-r from-amber-600 to-orange-600 pb-4 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
          Siman Gratuito do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            {siman.tratado && (
              <span className="mb-1 block text-xs text-muted-foreground">{siman.tratado}</span>
            )}
            <h3 className="mb-1 text-base font-semibold">Siman {siman.numero}</h3>
            {siman.titulo &&
              siman.titulo !== `Siman ${siman.numero}` &&
              !siman.titulo.includes(`Siman ${siman.numero}`) &&
              !siman.titulo.includes(`Siman ${siman.numero.toString().padStart(3, '0')}`) && (
                <p className="text-xs text-muted-foreground">{siman.titulo}</p>
              )}
            {siman.extractedTitle && (
              <div className="mt-3 rounded-lg border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-3 shadow-sm">
                <p className="text-sm font-medium italic text-amber-800">{siman.extractedTitle}</p>
              </div>
            )}
          </div>

          {/* Conteúdo principal do siman */}
          {siman.conteudo && (
            <div>
              <h3 className="mb-3 text-sm font-semibold">Conteúdo</h3>
              <div className="prose prose-sm max-w-none rounded-lg border border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50 p-4 text-xs leading-relaxed shadow-sm">
                <div dangerouslySetInnerHTML={{ __html: siman.conteudo.replace(/\n/g, '<br/>') }} />
              </div>
              {siman.isPreview && (
                <div className="mt-4 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 animate-pulse text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">
                      🔒 Conteúdo Completo Disponível
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-amber-700">
                    <strong>Preview limitado!</strong> Para acessar o conteúdo completo, faça sua
                    assinatura.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="h-8 bg-gradient-to-r from-amber-600 to-orange-600 px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-amber-700 hover:to-orange-700 hover:shadow-lg"
                    >
                      <Link href="/dashboard">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Assinar
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 border-2 border-amber-300 px-4 text-sm text-amber-700 shadow-md transition-all duration-200 hover:border-amber-400 hover:bg-amber-50 hover:shadow-lg"
                    >
                      <Link href="/livros">Ver Livros</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
