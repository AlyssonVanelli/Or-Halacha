'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock } from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'

export default function PoliticaCopiaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader />
      <main className="flex-1">
        <div className="container py-8">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-bold text-gray-800">
                Política de Cópia Não Permitida
              </h1>
              <p className="text-lg text-gray-600">
                Termos e condições para proteção de conteúdo e direitos autorais
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
                    Esta política estabelece as regras e restrições para o uso do conteúdo protegido
                    na plataforma Or Halachá. Todo o conteúdo é protegido por direitos autorais e
                    sujeito a restrições de uso.
                  </p>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Restrições de Uso */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    Restrições de Uso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-red-50 p-4">
                    <h4 className="mb-2 font-semibold text-red-800">❌ Proibido:</h4>
                    <ul className="space-y-2 text-sm text-red-700">
                      <li>• Copiar, reproduzir ou distribuir qualquer conteúdo</li>
                      <li>• Fazer screenshots ou capturas de tela</li>
                      <li>• Imprimir páginas ou seções do conteúdo</li>
                      <li>• Baixar ou salvar conteúdo localmente</li>
                      <li>• Compartilhar credenciais de acesso</li>
                      <li>• Usar ferramentas de automação para extrair dados</li>
                      <li>• Fazer engenharia reversa da plataforma</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Uso Permitido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Uso Permitido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-green-50 p-4">
                    <h4 className="mb-2 font-semibold text-green-800">✅ Permitido:</h4>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Leitura e estudo pessoal do conteúdo</li>
                      <li>• Navegação normal pela plataforma</li>
                      <li>• Uso de funcionalidades de busca</li>
                      <li>• Acesso através de dispositivos autorizados</li>
                      <li>• Uso conforme os termos de assinatura</li>
                      <li>• Compartilhamento de links públicos (quando disponível)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Direitos Autorais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-indigo-600" />
                    Direitos Autorais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      Todo o conteúdo da plataforma Or Halachá é protegido por direitos autorais. O
                      acesso é concedido apenas para uso pessoal e educacional, conforme os termos
                      da assinatura.
                    </p>
                    <div className="rounded-lg bg-indigo-50 p-4">
                      <h4 className="mb-2 font-semibold text-indigo-800">Proteção Legal:</h4>
                      <ul className="space-y-1 text-sm text-indigo-700">
                        <li>• Copyright © 2025 Or Halachá. Todos os direitos reservados.</li>
                        <li>• Conteúdo protegido pela Lei de Direitos Autorais (Lei 9.610/98)</li>
                        <li>• Violações podem resultar em ações legais</li>
                        <li>• Uso comercial requer autorização expressa</li>
                      </ul>
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
                    Para dúvidas sobre esta política ou solicitações especiais de uso:
                  </p>
                  <div className="rounded-lg bg-purple-50 p-4">
                    <ul className="space-y-2 text-sm">
                      <li>
                        • <strong>Email:</strong> suporte@or-halacha.com
                      </li>
                      <li>
                        • <strong>Assunto:</strong> &quot;Política de Cópia&quot;
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
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2025 Or Halachá. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <a href="/termos" className="text-sm text-gray-500 underline-offset-4 hover:underline">
              Termos de Uso
            </a>
            <a
              href="/privacidade"
              className="text-sm text-gray-500 underline-offset-4 hover:underline"
            >
              Política de Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
