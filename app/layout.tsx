'use client'
import type React from 'react'
import '@/app/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/toaster'
import { useEffect } from 'react'
import CookieBanner from '@/app/components/CookieBanner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Bloquear clique direito
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)

    // Bloquear Ctrl+C e seleção
    const handleCopy = (e: ClipboardEvent) => e.preventDefault()
    document.addEventListener('copy', handleCopy)

    // Bloquear PrintScreen e atalhos comuns de print
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        showOverlay()
        // Limpar área de transferência (alguns navegadores)
        if (navigator.clipboard) {
          navigator.clipboard.writeText('')
        }
      }
      // Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        showOverlay()
      }
      // Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Overlay para print
    function showOverlay() {
      const overlay = document.createElement('div')
      overlay.style.position = 'fixed'
      overlay.style.top = '0'
      overlay.style.left = '0'
      overlay.style.width = '100vw'
      overlay.style.height = '100vh'
      overlay.style.background = 'black'
      overlay.style.opacity = '0.98'
      overlay.style.zIndex = '999999'
      overlay.style.pointerEvents = 'none'
      document.body.appendChild(overlay)
      setTimeout(() => {
        document.body.removeChild(overlay)
      }, 1200)
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Or Halachá - Shulchan Aruch em Português</title>
        <meta
          name="description"
          content="Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim. Estude, pesquise e aprofunde seu conhecimento em Halachá clássica."
        />
        <meta
          name="keywords"
          content="Shulchan Aruch, Halachá, Judaísmo, Lei Judaica, Talmud, Mishná, Torá, Estudo Judaico, Religião, Tradição Judaica, Or Halachá, Português, Brasil"
        />
        <meta name="author" content="Or Halachá" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://or-halacha.vercel.app" />
        <meta property="og:title" content="Or Halachá - Shulchan Aruch em Português" />
        <meta
          property="og:description"
          content="Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim."
        />
        <meta property="og:image" content="/og-image.svg" />
        <meta property="og:site_name" content="Or Halachá" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://or-halacha.vercel.app" />
        <meta property="twitter:title" content="Or Halachá - Shulchan Aruch em Português" />
        <meta
          property="twitter:description"
          content="Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim."
        />
        <meta property="twitter:image" content="/og-image.svg" />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="canonical" href="https://or-halacha.vercel.app" />
      </head>
      <body suppressHydrationWarning={true}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            {children}
            <CookieBanner />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
