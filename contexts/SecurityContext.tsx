import { createContext, useContext } from 'react'
import jwt from 'jsonwebtoken'
import type { ReactNode } from 'react'

interface SecurityContextType {
  sanitizeInput: (input: string) => string
  validateToken: (token: string) => Promise<boolean>
  validateCsrfToken: (token: string) => boolean
}

export const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export function SecurityProvider({ children }: { children: ReactNode }) {
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      jwt.verify(token, process.env['JWT_SECRET'] || 'test-secret')
      return true
    } catch {
      return false
    }
  }

  const validateCsrfToken = (token: string): boolean => {
    // Implementação básica - em produção usar uma biblioteca como csurf
    return token === (globalThis.localStorage?.getItem('csrfToken') || '')
  }

  return (
    <SecurityContext.Provider value={{ sanitizeInput, validateToken, validateCsrfToken }}>
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error('useSecurity deve ser usado dentro de um SecurityProvider')
  }
  return context
}
