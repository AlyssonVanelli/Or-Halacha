import { render, act } from '@testing-library/react'
import { SecurityProvider, SecurityContext } from '@/contexts/SecurityContext'
import { useContext } from 'react'
import { vi } from 'vitest'

describe('SecurityContext', () => {
  it('deve sanitizar input corretamente', () => {
    let contextValue: any
    const TestComponent = () => {
      contextValue = useContext(SecurityContext)
      return null
    }

    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    )

    expect(contextValue.sanitizeInput('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#039;')
  })

  it('deve validar token JWT corretamente', async () => {
    let contextValue: any
    const TestComponent = () => {
      contextValue = useContext(SecurityContext)
      return null
    }

    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    )

    // Teste com token válido
    const jwt = require('jsonwebtoken')
    const validToken = jwt.sign({ sub: '123', name: 'John Doe' }, 'test-secret')
    expect(await contextValue.validateToken(validToken)).toBe(true)

    // Teste com token inválido
    expect(await contextValue.validateToken('invalid-token')).toBe(false)
  })

  it('deve validar CSRF token corretamente', () => {
    let contextValue: any
    const TestComponent = () => {
      contextValue = useContext(SecurityContext)
      return null
    }

    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    )

    // Simula token no localStorage
    const testToken = 'test-csrf-token'
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(testToken),
      },
      configurable: true,
    })

    expect(contextValue.validateCsrfToken(testToken)).toBe(true)
    expect(contextValue.validateCsrfToken('wrong-token')).toBe(false)
  })
})
