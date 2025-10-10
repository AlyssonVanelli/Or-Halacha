'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertTriangle, Lock, Eye, Copy } from 'lucide-react'

export default function PoliticaCopiaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">Política de Cópia Não Permitida</h1>
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
                Esta política estabelece as regras e restrições para o uso do conteúdo protegido na
                plataforma Or Halachá. Todo o conteúdo é protegido por direitos autorais e sujeito a
                restrições de uso.
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

          {/* Medidas de Proteção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                Medidas de Proteção Implementadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-purple-50 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-purple-800">Proteção Técnica</h3>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li>• Bloqueio de seleção de texto</li>
                    <li>• Desabilitação de clique direito</li>
                    <li>• Bloqueio de atalhos de teclado</li>
                    <li>• Proteção contra screenshots</li>
                    <li>• Bloqueio de impressão</li>
                    <li>• Detecção de ferramentas de desenvolvedor</li>
                  </ul>
                </div>
                <div className="rounded-lg border bg-orange-50 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-orange-800">Monitoramento</h3>
                  <ul className="space-y-2 text-sm text-orange-700">
                    <li>• Rastreamento de atividades suspeitas</li>
                    <li>• Detecção de uso anômalo</li>
                    <li>• Logs de acesso e navegação</li>
                    <li>• Alertas de violação de segurança</li>
                    <li>• Bloqueio automático de IPs suspeitos</li>
                    <li>• Análise de padrões de uso</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atalhos Bloqueados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-yellow-600" />
                Atalhos e Funções Bloqueadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="mb-2 text-sm font-semibold">Teclado</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Ctrl+C (Copiar)</li>
                      <li>• Ctrl+A (Selecionar tudo)</li>
                      <li>• Ctrl+S (Salvar)</li>
                      <li>• Ctrl+P (Imprimir)</li>
                      <li>• F12 (DevTools)</li>
                      <li>• PrintScreen</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="mb-2 text-sm font-semibold">Mouse</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Clique direito</li>
                      <li>• Arrastar e soltar</li>
                      <li>• Seleção de texto</li>
                      <li>• Scroll com botão do meio</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="mb-2 text-sm font-semibold">Navegador</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Menu de contexto</li>
                      <li>• Ferramentas de desenvolvedor</li>
                      <li>• Inspeção de elementos</li>
                      <li>• Console do navegador</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consequências da Violação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Consequências da Violação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4">
                <h4 className="mb-2 font-semibold text-red-800">Ações Tomadas:</h4>
                <ul className="space-y-2 text-sm text-red-700">
                  <li>
                    • <strong>Primeira violação:</strong> Aviso e suspensão temporária (24h)
                  </li>
                  <li>
                    • <strong>Segunda violação:</strong> Suspensão por 7 dias
                  </li>
                  <li>
                    • <strong>Terceira violação:</strong> Suspensão por 30 dias
                  </li>
                  <li>
                    • <strong>Violações graves:</strong> Bloqueio permanente da conta
                  </li>
                  <li>
                    • <strong>Uso comercial não autorizado:</strong> Ações legais
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4">
                <h4 className="mb-2 font-semibold text-yellow-800">Monitoramento Ativo:</h4>
                <p className="text-sm text-yellow-700">
                  Todas as atividades são monitoradas em tempo real. Tentativas de violação são
                  detectadas automaticamente e podem resultar em bloqueio imediato.
                </p>
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
                  acesso é concedido apenas para uso pessoal e educacional, conforme os termos da
                  assinatura.
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
  )
}
