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
      <body>
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
