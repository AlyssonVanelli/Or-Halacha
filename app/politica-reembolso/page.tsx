import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CreditCard, Shield } from 'lucide-react'
import { ConditionalLayout } from '@/components/ConditionalLayout'
import { SupportContact } from '@/components/SupportContact'
import { HOTMART_BUYER_AREA_URL, REFUND_DAYS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Política de Reembolso',
  description: `Garantia de ${REFUND_DAYS} dias com reembolso integral pela Hotmart.`,
  alternates: { canonical: '/politica-reembolso' },
}

const buyerArea = (
  <a
    href={HOTMART_BUYER_AREA_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="font-semibold text-blue-700 underline"
  >
    área do comprador da Hotmart
  </a>
)

export default function PoliticaReembolsoPage() {
  return (
    <ConditionalLayout>
      <div className="container py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-800">Política de Reembolso</h1>
            <p className="text-lg text-gray-600">Garantia de {REFUND_DAYS} dias, sem perguntas</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Informações gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Os pagamentos do Or Halachá são processados pela Hotmart. Por isso, o reembolso
                  também é pedido e feito pela Hotmart, que devolve o valor e avisa o site para
                  encerrar o acesso.
                </p>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Última atualização:</strong> 01/10/2026
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Prazo e condições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-green-800">
                      Até {REFUND_DAYS} dias após a compra
                    </h3>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>
                        • Reembolso integral, sem precisar justificar (direito de arrependimento)
                      </li>
                      <li>• Vale para assinaturas (mensal ou anual) e para o tratado avulso</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">
                      Depois de {REFUND_DAYS} dias
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Você pode cancelar a renovação a qualquer momento</li>
                      <li>• O acesso continua até o fim do período já pago</li>
                      <li>• Não há reembolso proporcional do período restante</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Como pedir o reembolso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Abra a área do comprador',
                      body: <>Acesse a {buyerArea} e entre com o e-mail usado na compra.</>,
                    },
                    {
                      title: 'Escolha a compra',
                      body: 'Em “Minhas compras”, abra o Or Halachá e peça o reembolso (ou o cancelamento com reembolso).',
                    },
                    {
                      title: 'Acesso encerrado',
                      body: 'Quando a Hotmart confirma o reembolso, o acesso pago termina automaticamente no site.',
                    },
                    {
                      title: 'Devolução do valor',
                      body: 'No Pix, o valor volta para a conta de origem; no cartão, o estorno aparece na fatura conforme o prazo do banco.',
                    },
                  ].map((step, i) => (
                    <div key={step.title} className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">
                        {i + 1}
                      </Badge>
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Prefere ajuda? Fale com a gente pelo <SupportContact /> que fazemos o pedido com
                  você.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Casos especiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-800">Problemas técnicos</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Se um problema do site impedir o acesso ao conteúdo pago, devolvemos o valor
                      mesmo depois de {REFUND_DAYS} dias. Fale com o suporte.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-800">Cobrança duplicada</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Cobrança em dobro por erro é devolvida integralmente. Fale com o suporte.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ConditionalLayout>
  )
}
