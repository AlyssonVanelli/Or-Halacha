// /pages/termos.tsx
'use client'

import Link from 'next/link'
import { ConditionalLayout } from '@/components/ConditionalLayout'

export default function Termos() {
  return (
    <ConditionalLayout>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-slate-50 py-12 dark:bg-slate-900">
          <div className="container mx-auto max-w-2xl px-4 md:px-6">
            <h1 className="mb-4 text-3xl font-bold">Termos de Uso</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Bem-vindo ao Or Halacha! Antes de usar, leia com atenção estes termos.
            </p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">1. Aceite dos termos</h2>
            <p>
              Ao acessar o site, você concorda com estes termos e nossa{' '}
              <Link href="/privacidade" className="underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">2. Conta e senha</h2>
            <p>Você é responsável por manter sua senha em sigilo. Não compartilhe sua conta.</p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">3. Uso permitido</h2>
            <p>
              É permitido usar o conteúdo para estudo pessoal. Qualquer reprodução deve citar a
              fonte.
            </p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">4. Responsabilidades</h2>
            <p>Não nos responsabilizamos por uso indevido do conteúdo ou decisões baseadas nele.</p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">5. Modificações</h2>
            <p>Podemos alterar estes termos a qualquer momento. Avisaremos no site.</p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">6. Contato</h2>
            <p>
              Em caso de dúvidas, mande e-mail para{' '}
              <a href="mailto:termos@orhalacha.com" className="underline">
                termos@orhalacha.com
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
