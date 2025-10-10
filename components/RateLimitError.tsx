'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, RefreshCw, Home, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRateLimitCountdown } from '@/hooks/useRateLimitCountdown'

interface RateLimitErrorProps {
  retryAfter?: number
}

export function RateLimitError({ retryAfter = 900 }: RateLimitErrorProps) {
  const { seconds, isExpired, formattedTime } = useRateLimitCountdown(retryAfter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Muitas Solicitações
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Você excedeu o limite de solicitações. Por favor, aguarde um momento antes de tentar novamente.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={`border rounded-lg p-4 ${isExpired ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              {isExpired ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <h3 className={`font-semibold ${isExpired ? 'text-green-800' : 'text-amber-800'}`}>
                  {isExpired ? 'Pronto para tentar novamente!' : 'Tempo de espera'}
                </h3>
                <p className={`text-sm ${isExpired ? 'text-green-700' : 'text-amber-700'}`}>
                  {isExpired ? (
                    'Você pode tentar novamente agora.'
                  ) : (
                    <>
                      Tente novamente em: <span className="font-mono font-bold text-lg">{formattedTime}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Por que isso aconteceu?</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Muitas requisições em um curto período de tempo</li>
              <li>• Navegação muito rápida entre páginas</li>
              <li>• Múltiplas tentativas de login</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Dicas para evitar:</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Aguarde alguns segundos entre as ações</li>
              <li>• Evite clicar múltiplas vezes nos botões</li>
              <li>• Use a navegação do site de forma mais pausada</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => window.location.reload()} 
              className={`flex-1 ${isExpired ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
              disabled={!isExpired}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isExpired ? 'Tentar Novamente' : 'Aguarde...'}
            </Button>
            
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Ir para Início
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              Se o problema persistir, entre em contato conosco através do{' '}
              <Link href="/suporte" className="text-blue-600 hover:underline">
                suporte
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
