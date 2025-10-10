import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer role="contentinfo" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Or Halacha. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
