import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer role="contentinfo" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-gray-500 md:text-left">
            © {new Date().getFullYear()} Or Halachá. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="/termos"
              className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
            >
              Termos de Uso
            </a>
            <a
              href="/privacidade"
              className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
            >
              Política de Privacidade
            </a>
            <a
              href="/politica-compra"
              className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
            >
              Política de Compra
            </a>
            <a
              href="/politica-reembolso"
              className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
            >
              Política de Reembolso
            </a>
            <a
              href="/politica-copia"
              className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
            >
              Política de Cópia
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
