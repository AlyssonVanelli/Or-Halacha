'use client'

import { useEffect } from 'react'

export function ScrollToSection() {
  useEffect(() => {
    const handleScrollToSection = () => {
      // Verifica se há hash na URL
      const hash = window.location.hash
      if (hash) {
        // Remove o # do hash
        const sectionId = hash.substring(1)

        // Aguarda um pouco para garantir que a página carregou
        setTimeout(() => {
          const element = document.getElementById(sectionId)
          if (element) {
            // Rola suavemente para a seção
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }
        }, 100)
      }
    }

    // Executa quando a página carrega
    handleScrollToSection()

    // Executa quando a URL muda (para navegação SPA)
    const handleHashChange = () => {
      handleScrollToSection()
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return null
}
