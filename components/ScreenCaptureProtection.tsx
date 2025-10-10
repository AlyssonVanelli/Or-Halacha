'use client'

import { useEffect } from 'react'

// Interface para CSSStyleDeclaration com propriedades específicas do navegador
interface ExtendedCSSStyleDeclaration extends CSSStyleDeclaration {
  mozUserSelect?: string
  msUserSelect?: string
}

export const ScreenCaptureProtection: React.FC = () => {
  useEffect(() => {
    // Bloquear captura de tela no Android
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Usuário tentou capturar tela ou mudou de app
        document.body.style.filter = 'blur(20px)'
        document.body.style.userSelect = 'none'
        document.body.style.webkitUserSelect = 'none'
        ;(document.body.style as ExtendedCSSStyleDeclaration).mozUserSelect = 'none'
        ;(document.body.style as ExtendedCSSStyleDeclaration).msUserSelect = 'none'
      } else {
        // Usuário voltou para o app
        document.body.style.filter = 'none'
        document.body.style.userSelect = 'auto'
        document.body.style.webkitUserSelect = 'auto'
        ;(document.body.style as ExtendedCSSStyleDeclaration).mozUserSelect = 'auto'
        ;(document.body.style as ExtendedCSSStyleDeclaration).msUserSelect = 'auto'
      }
    }

    // Bloquear seleção de texto
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Bloquear menu de contexto (botão direito)
    const handleContextMenu = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Bloquear teclas de atalho
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear teclas de captura de tela do Windows
      if (
        e.key === 'F12' ||
        e.key === 'PrintScreen' ||
        e.key === 'F11' ||
        e.key === 'F10' ||
        e.key === 'F9' ||
        e.key === 'F8' ||
        e.key === 'F7' ||
        e.key === 'F6' ||
        e.key === 'F5' ||
        e.key === 'F4' ||
        e.key === 'F3' ||
        e.key === 'F2' ||
        e.key === 'F1' ||
        // Windows + Shift + S (Snipping Tool)
        (e.metaKey && e.shiftKey && e.key === 'S') ||
        // Windows + G (Game Bar)
        (e.metaKey && e.key === 'g') ||
        // Windows + Alt + PrintScreen
        (e.metaKey && e.altKey && e.key === 'PrintScreen') ||
        // Ctrl + Shift + I (DevTools)
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        // Ctrl + Shift + J ()
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        // Ctrl + Shift + C (Element Inspector)
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        // Ctrl + U (View Source)
        (e.ctrlKey && e.key === 'U') ||
        // Ctrl + S (Save)
        (e.ctrlKey && e.key === 'S') ||
        // Ctrl + A (Select All)
        (e.ctrlKey && e.key === 'A') ||
        // Ctrl + C (Copy)
        (e.ctrlKey && e.key === 'C') ||
        // Ctrl + V (Paste)
        (e.ctrlKey && e.key === 'V') ||
        // Ctrl + X (Cut)
        (e.ctrlKey && e.key === 'X') ||
        // Ctrl + P (Print)
        (e.ctrlKey && e.key === 'P') ||
        // Alt + Tab (Switch Windows)
        (e.altKey && e.key === 'Tab') ||
        // Alt + F4 (Close Window)
        (e.altKey && e.key === 'F4') ||
        // Windows + Tab (Task View)
        (e.metaKey && e.key === 'Tab') ||
        // Windows + D (Show Desktop)
        (e.metaKey && e.key === 'd') ||
        // Windows + L (Lock Screen)
        (e.metaKey && e.key === 'l') ||
        // Windows + R (Run Dialog)
        (e.metaKey && e.key === 'r') ||
        // Windows + E (File Explorer)
        (e.metaKey && e.key === 'e') ||
        // Windows + I (Settings)
        (e.metaKey && e.key === 'i') ||
        // Windows + X (Power User Menu)
        (e.metaKey && e.key === 'x') ||
        // Windows + M (Minimize All)
        (e.metaKey && e.key === 'm') ||
        // Windows + Shift + M (Restore All)
        (e.metaKey && e.shiftKey && e.key === 'M') ||
        // Windows + Up (Maximize)
        (e.metaKey && e.key === 'ArrowUp') ||
        // Windows + Down (Minimize)
        (e.metaKey && e.key === 'ArrowDown') ||
        // Windows + Left (Snap Left)
        (e.metaKey && e.key === 'ArrowLeft') ||
        // Windows + Right (Snap Right)
        (e.metaKey && e.key === 'ArrowRight')
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // Detectar tentativas de captura de tela
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Tentativa de captura de tela detectada'
      return 'Tentativa de captura de tela detectada'
    }

    // Bloquear drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // Bloquear focus em elementos
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        e.target.blur()
      }
    }

    // Adicionar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('focus', handleFocus, true)

    // CSS para bloquear captura de tela
    const style = document.createElement('style')
    style.textContent = `
      /* Bloquear seleção de texto */
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }

      /* Bloquear captura de tela no iOS */
      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        body {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
        }
      }

      /* Bloquear zoom */
      @media screen and (max-width: 768px) {
        body {
          touch-action: manipulation !important;
        }
      }

      /* Bloquear impressão */
      @media print {
        body * {
          visibility: hidden !important;
        }
        body::before {
          content: "Conteúdo protegido contra impressão" !important;
          visibility: visible !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          font-size: 24px !important;
          color: red !important;
        }
      }
    `
    document.head.appendChild(style)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('focus', handleFocus, true)
      document.head.removeChild(style)
    }
  }, [])

  return null
}
