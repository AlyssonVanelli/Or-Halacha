'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Shield, CreditCard, Clock, Users } from 'lucide-react'
import { Display, Body } from '@/components/ui/typography'
import { ConditionalLayout } from '@/components/ConditionalLayout'
import { SupportContact } from '@/components/SupportContact'
import {
  HOTMART_BUYER_AREA_URL,
  PLANS,
  PLAN_ORDER,
  REFUND_DAYS,
  TREATISE_PRICE,
  annualFreeMonths,
  brl,
} from '@/lib/plans'

export default function PoliticaCompraPage() {
  return (
    <ConditionalLayout>
      <div className="container py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <Display className="mb-4">Política de Compra</Display>
            <Body className="text-lg text-gray-600">
              Termos e condições para aquisição de assinaturas e tratados individuais
            </Body>
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
                  Esta política estabelece os termos e condições para a compra de assinaturas e
                  tratados individuais na plataforma Or Halachá. Ao realizar uma compra, você
                  concorda com todos os termos aqui descritos.
                </p>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Última atualização:</strong> 01/10/2026
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Compra */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Tipos de Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 text-lg font-semibold">Assinaturas Mensais/Anuais</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Acesso completo a todos os tratados</li>
                      <li>• Renovação automática (todo mês ou a cada 12 meses)</li>
                      <li>• Cancelamento da renovação a qualquer momento</li>
                      <li>• Plano anual pago à vista, sem parcelamento</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 text-lg font-semibold">Tratados Individuais</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Acesso por 1 mês</li>
                      <li>• Compra única</li>
                      <li>• Sem renovação automática</li>
                      <li>• Pode ser recomprado</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processo de Compra */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  Processo de Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      1
                    </Badge>
                    <div>
                      <h4 className="font-semibold">Seleção do Produto</h4>
                      <p className="text-sm text-gray-600">
                        Escolha entre assinatura completa ou tratado individual específico.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      2
                    </Badge>
                    <div>
                      <h4 className="font-semibold">Pagamento Seguro</h4>
                      <p className="text-sm text-gray-600">
                        O pagamento é feito no checkout da Hotmart (Pix ou cartão de crédito), que
                        processa a cobrança e envia o recibo para o seu e-mail. O Or Halachá não
                        recebe nem guarda os dados do seu cartão.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      3
                    </Badge>
                    <div>
                      <h4 className="font-semibold">Ativação Imediata</h4>
                      <p className="text-sm text-gray-600">
                        O acesso é liberado na sua conta assim que a Hotmart confirma o pagamento:
                        no cartão, em segundos; no Pix, assim que o pagamento é concluído.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preços e Pagamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Preços e Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 font-semibold">Formas de Pagamento Aceitas:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Pix</li>
                    <li>• Cartão de crédito</li>
                    <li>
                      • O plano anual é cobrado à vista (uma única cobrança por ano), sem
                      parcelamento
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4">
                  <h4 className="mb-2 font-semibold text-yellow-800">Preços:</h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {PLAN_ORDER.map(id => {
                      const plan = PLANS[id]
                      return (
                        <li key={id}>
                          • {plan.name}: {brl(plan.price)}
                          {plan.interval === 'year'
                            ? `/ano, à vista (${annualFreeMonths(plan)} meses grátis em relação ao mensal)`
                            : '/mês'}
                        </li>
                      )
                    })}
                    <li>
                      • Tratado individual: {brl(TREATISE_PRICE)} (1 mês de acesso, pagamento único)
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Renovação e Cancelamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  Renovação e Cancelamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-800">Renovação Automática</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Assinaturas são renovadas automaticamente pela Hotmart. Você pode cancelar a
                      renovação a qualquer momento na{' '}
                      <a
                        href={HOTMART_BUYER_AREA_URL}
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        área do comprador da Hotmart
                      </a>{' '}
                      (Minhas compras → Or Halachá) ou pedindo ajuda ao nosso suporte.
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-800">Cancelamento</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      O acesso permanece ativo até o fim do período pago. Nos primeiros{' '}
                      {REFUND_DAYS} dias após a compra, você pode pedir o reembolso integral (veja a
                      Política de Reembolso).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suporte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Suporte e Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-700">
                  Para dúvidas sobre compras, pagamentos ou problemas técnicos, entre em contato
                  conosco:
                </p>
                <div className="rounded-lg bg-indigo-50 p-4">
                  <ul className="space-y-2 text-sm">
                    <li>
                      • <strong>Contato:</strong> <SupportContact />
                    </li>
                    <li>
                      • <strong>WhatsApp:</strong> Disponível na página de suporte
                    </li>
                    <li>
                      • <strong>Horário de atendimento:</strong> Domingo a Quinta, 16h às 22h
                      (horário de Israel)
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
