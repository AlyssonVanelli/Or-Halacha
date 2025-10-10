import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { HeaderSimplificado } from '@/components/DashboardHeader'

export default function NotFound() {
  return (
    <>
      <HeaderSimplificado />
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-950">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-600">Or Halachá</h2>
            <p className="text-sm text-gray-600">Plataforma de Estudo Haláchico</p>
          </div>
        </div>

        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-slate-800 dark:text-white">404</h1>
          <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
            Página não encontrada
          </h2>
          <p className="mb-8 max-w-md text-center text-gray-600 dark:text-gray-300">
            Ops! A página que você tentou acessar não existe ou foi removida.
            <br />
            Verifique o endereço ou navegue para outra seção do site.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              🏠 Voltar ao Início
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              📚 Ir para Biblioteca
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
