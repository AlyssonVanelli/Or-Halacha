import { render, screen, fireEvent } from '@testing-library/react'
import { SecurityProvider } from '@/contexts/SecurityContext'
import { useSecurity } from '@/contexts/SecurityContext'
import { useState } from 'react'

describe('Segurança', () => {
  it('deve prevenir XSS em inputs', () => {
    const TestComponent = () => {
      const { sanitizeInput } = useSecurity()
      const [value, setValue] = useState('')

      return (
        <input
          data-testid="input"
          value={value}
          onChange={e => setValue(sanitizeInput(e.target.value))}
        />
      )
    }

    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    )

    const input = screen.getByTestId('input') as HTMLInputElement
    fireEvent.change(input, {
      target: { value: '<script>alert("xss")</script>' },
    })

    expect(input.value).not.toContain('<script>')
  })

  it('deve validar tokens JWT', async () => {
    const TestComponent = () => {
      const { validateToken } = useSecurity()
      const [error, setError] = useState('')

      const handleValidate = async () => {
        const valid = await validateToken('invalid-token')
        if (!valid) setError('Token inválido')
      }

      return (
        <>
          <button onClick={handleValidate}>Validar Token</button>
          {error && <div>{error}</div>}
        </>
      )
    }

    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    )

    fireEvent.click(screen.getByText('Validar Token'))
    expect(await screen.findByText('Token inválido')).toBeInTheDocument()
  })

  it('deve prevenir CSRF', () => {
    const TestComponent = () => {
      const { validateCsrfToken } = useSecurity()
      const [error, setError] = useState('')

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const isValid = validateCsrfToken('invalid-token')
        if (!isValid) setError('Token CSRF inválido')
      }

      return (
        <form onSubmit={handleSubmit}>
          <button type="submit">Enviar</button>
          {error && <div>{error}</div>}
        </form>
      )
    }

    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    )

    fireEvent.click(screen.getByText('Enviar'))
    expect(screen.getByText('Token CSRF inválido')).toBeInTheDocument()
  })
})
