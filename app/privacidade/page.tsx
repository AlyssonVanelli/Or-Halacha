// /pages/privacidade.tsx
'use client'

import Link from 'next/link'
import { ConditionalLayout } from '@/components/ConditionalLayout'

export default function Privacidade() {
  return (
    <ConditionalLayout>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-slate-50 py-12 dark:bg-slate-900">
          <div className="container mx-auto max-w-2xl px-4 md:px-6">
            <h1 className="mb-4 text-3xl font-bold">Política de Privacidade</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              No Or Halacha, sua privacidade é sagrada. Este documento explica como coletamos,
              usamos e armazenamos seus dados.
            </p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">1. Dados que coletamos</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>
                <strong>Dados de conta:</strong> nome, e-mail, foto (opcional).
              </li>
              <li>
                <strong>Dados de uso:</strong> logs de acesso, histórico de navegação no dashboard.
              </li>
              <li>
                <strong>Cookies:</strong> essenciais, analytics e marketing, conforme seu
                consentimento.
              </li>
            </ul>
            <h2 className="mb-2 mt-6 text-xl font-semibold">2. Finalidades</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>Autenticar e autorizar acesso (sessão única).</li>
              <li>Melhorar a plataforma via estatísticas (analytics).</li>
              <li>Enviar notificações e promoções (marketing), se autorizado.</li>
            </ul>
            <h2 className="mb-2 mt-6 text-xl font-semibold">3. Compartilhamento</h2>
            <p>
              Nunca vendemos seus dados. Podemos compartilhar dados anonimizados para estatísticas
              gerais.
            </p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">4. Seus direitos (LGPD)</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>Acessar, corrigir ou excluir seus dados.</li>
              <li>Revogar consentimento a qualquer momento.</li>
            </ul>
            <h2 className="mb-2 mt-6 text-xl font-semibold">5. Contato</h2>
            <p>
              Para exercer seus direitos ou dúvidas, envie um e-mail para{' '}
              <a href="mailto:privacidade@orhalacha.com" className="underline">
                privacidade@orhalacha.com
              </a>
              .
            </p>
          </div>
        </main>
        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
              © 2025 Or Halachá. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link
                href="/termos"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacidade"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </ConditionalLayout>
  )
}
