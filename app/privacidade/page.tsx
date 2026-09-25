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
                <strong>Dados de conta:</strong> e-mail, nome e foto (opcionais).
              </li>
              <li>
                <strong>Dados de uso da conta:</strong> seifim favoritados, assinatura ou tratado
                comprado, registros de consentimento e pedidos de suporte.
              </li>
              <li>
                <strong>Pagamento:</strong> feito diretamente no Stripe. Não armazenamos dados do
                seu cartão.
              </li>
              <li>
                <strong>Estatísticas:</strong> contagem agregada e anônima de visitas às páginas,
                sem identificar você.
              </li>
              <li>
                <strong>Cookies:</strong> essenciais (login e preferências) e, se você autorizar,
                analytics e marketing.
              </li>
            </ul>
            <h2 className="mb-2 mt-6 text-xl font-semibold">2. Finalidades</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>Criar e autenticar sua conta e liberar o conteúdo contratado.</li>
              <li>Processar pagamentos, cancelamentos e reembolsos.</li>
              <li>Responder pedidos de suporte.</li>
              <li>Melhorar a plataforma com estatísticas anônimas.</li>
              <li>Enviar novidades e promoções, somente se você autorizar.</li>
            </ul>
            <h2 className="mb-2 mt-6 text-xl font-semibold">3. Compartilhamento</h2>
            <p className="mb-2">
              Nunca vendemos seus dados. Eles são tratados apenas pelos serviços necessários para o
              site funcionar:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>
                <strong>Supabase</strong> — banco de dados e login;
              </li>
              <li>
                <strong>Stripe</strong> — pagamentos;
              </li>
              <li>
                <strong>Vercel</strong> — hospedagem e estatísticas anônimas;
              </li>
              <li>
                <strong>provedor de e-mail</strong> — envio de e-mails de conta e suporte.
              </li>
            </ul>
            <p className="mb-4">
              Esses serviços podem armazenar dados fora do Brasil, com garantias contratuais de
              proteção.
            </p>
            <h2 className="mb-2 mt-6 text-xl font-semibold">4. Seus direitos (LGPD)</h2>
            <ul className="mb-4 list-disc pl-6">
              <li>Acessar e corrigir seus dados em &quot;Meu perfil&quot;.</li>
              <li>
                Excluir sua conta e seus dados a qualquer momento em &quot;Meu perfil&quot; &gt;
                &quot;Excluir minha conta&quot;.
              </li>
              <li>Revogar consentimentos a qualquer momento.</li>
              <li>
                Registros de pagamento podem ser mantidos pelo Stripe pelo prazo exigido em lei.
              </li>
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
              © {new Date().getFullYear()} Or Halachá. Todos os direitos reservados.
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
