import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-950">
      <BookOpen className="mb-4 h-16 w-16 text-blue-700 dark:text-blue-400" />
      <h1 className="mb-2 text-4xl font-bold text-slate-800 dark:text-white">
        Página não encontrada
      </h1>
      <p className="mb-6 max-w-md text-center text-gray-600 dark:text-gray-300">
        Ops! A página que você tentou acessar não existe ou foi removida.
        <br />
        Verifique o endereço ou navegue para outra seção do site.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded bg-blue-700 px-6 py-2 font-semibold text-white transition hover:bg-blue-800"
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          className="rounded border border-blue-700 px-6 py-2 font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          Ir para Biblioteca
        </Link>
      </div>
    </div>
  )
}
