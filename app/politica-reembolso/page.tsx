'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CreditCard, Shield, CheckCircle } from 'lucide-react'
import { ConditionalLayout } from '@/components/ConditionalLayout'

export default function PoliticaReembolsoPage() {
  return (
    <ConditionalLayout>
      <div className="container py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-800">Política de Reembolso</h1>
            <p className="text-lg text-gray-600">
              Termos e condições para solicitação de reembolsos
            </p>
          </div>

          <div className="space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Esta política estabelece os termos e condições para solicitação de reembolsos na
                  plataforma Or Halachá. Leia atentamente antes de realizar uma compra.
                </p>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Período de Reembolso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Período de Reembolso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border bg-green-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-green-800">Assinaturas</h3>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>
                        • <strong>7 dias</strong> a partir da compra para pedir reembolso
                      </li>
                      <li>• Reembolso integral dentro desse prazo (direito de arrependimento)</li>
                      <li>• Pedido pelo próprio perfil, em “Solicitar reembolso”</li>
                      <li>• Depois de 7 dias: cancelamento sem cobrança futura, sem reembolso</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border bg-blue-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-blue-800">
                      Tratados Individuais
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li>
                        • <strong>7 dias</strong> a partir da compra para pedir reembolso
                      </li>
                      <li>• Reembolso integral dentro desse prazo (direito de arrependimento)</li>
                      <li>• Compra única, sem renovação automática</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Condições para Reembolso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  Condições para Reembolso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <h4 className="mb-2 font-semibold text-green-800">✅ Reembolsos Aprovados:</h4>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Cobrança duplicada por erro do sistema</li>
                      <li>• Problemas técnicos que impedem o acesso</li>
                      <li>• Cancelamento dentro do período estabelecido</li>
                      <li>• Não utilização do serviço após a compra</li>
                      <li>• Problemas de pagamento não resolvidos</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <h4 className="mb-2 font-semibold text-red-800">❌ Reembolsos Negados:</h4>
                    <ul className="space-y-2 text-sm text-red-700">
                      <li>• Uso extensivo do conteúdo antes do cancelamento</li>
                      <li>• Cancelamento após o período de reembolso</li>
                      <li>• Mudança de opinião após uso satisfatório</li>
                      <li>• Problemas de conectividade do usuário</li>
                      <li>• Violação dos termos de uso</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processo de Solicitação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Como Solicitar Reembolso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      1
                    </Badge>
                    <div>
                      <h4 className="font-semibold">Acesse seu perfil</h4>
                      <p className="text-sm text-gray-600">
                        Entre na sua conta e abra &quot;Meu perfil&quot;. Se preferir, fale com o
                        suporte pela página /suporte.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      2
                    </Badge>
                    <div>
                      <h4 className="font-semibold">Clique em &quot;Solicitar reembolso&quot;</h4>
                      <p className="text-sm text-gray-600">
                        Confirme o pedido. Dentro de 7 dias da compra, o reembolso é feito na hora,
                        sem análise.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      3
                    </Badge>
                    <div>
                      <h4 className="font-semibold">Acesso encerrado</h4>
                      <p className="text-sm text-gray-600">
                        A assinatura é cancelada e o acesso pago termina no mesmo momento.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      4
                    </Badge>
                    <div>
                      <h4 className="font-semibold">Processamento</h4>
                      <p className="text-sm text-gray-600">
                        O estorno é enviado ao cartão na hora; o prazo para aparecer na fatura
                        depende do banco (normalmente de 5 a 10 dias úteis).
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formas de Reembolso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Formas de Reembolso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 font-semibold">Métodos de Reembolso:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      • <strong>Cartão:</strong> estorno no mesmo cartão usado na compra; o prazo
                      para aparecer na fatura depende do banco emissor
                    </li>
                  </ul>
                </div>
                <div className="mt-4 rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Importante:</strong> O reembolso será creditado na mesma forma de
                    pagamento utilizada na compra original.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Casos Especiais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Casos Especiais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-800">Problemas Técnicos</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Se houver problemas técnicos que impeçam o acesso ao conteúdo, oferecemos
                      reembolso integral independente do período de uso.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-800">Cobrança Duplicada</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Em caso de cobrança duplicada por erro do sistema, reembolsamos imediatamente
                      o valor duplicado.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Suporte e Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-700">
                  Para solicitar reembolsos ou esclarecer dúvidas sobre esta política:
                </p>
                <div className="rounded-lg bg-purple-50 p-4">
                  <ul className="space-y-2 text-sm">
                    <li>
                      • <strong>Email:</strong> suporte@or-halacha.com
                    </li>
                    <li>
                      • <strong>Assunto:</strong> &quot;Solicitação de Reembolso&quot;
                    </li>
                    <li>
                      • <strong>WhatsApp:</strong> Disponível na página de suporte
                    </li>
                    <li>
                      • <strong>Horário:</strong> Segunda a sexta, 9h às 18h
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ConditionalLayout>
  )
}
