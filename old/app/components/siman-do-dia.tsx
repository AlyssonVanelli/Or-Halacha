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
    isPreview?: boolean
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

          {/* Conteúdo principal do siman */}
          {siman.conteudo && (
            <div>
              <h3 className="mb-2 font-semibold">Conteúdo</h3>
              <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: siman.conteudo.replace(/\n/g, '<br/>') }} />
              </div>
              {siman.isPreview && (
                <div className="mt-4 rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-md">
                  <div className="mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">
                      🔒 Conteúdo Completo Disponível
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-amber-700">
                    <strong>Preview limitado!</strong> Para acessar o conteúdo completo e todos os
                    tratados, faça sua assinatura.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="bg-amber-600 font-semibold text-white hover:bg-amber-700"
                    >
                      <Link href="/planos">
                        <BookOpen className="mr-1 h-4 w-4" />
                        Assinar Agora
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
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
