import { render, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { LogoutButton } from '../components/logout-button'

// Mock do contexto de autenticação
vi.mock('../contexts/auth-context', () => ({
  useAuth: () => ({ user: null, signIn: vi.fn(), signOut: vi.fn() }),
}))

import { useAuth } from '../contexts/auth-context'

describe('LogoutButton', () => {
  it('renderiza sem erros', () => {
    render(<LogoutButton />)
  })

  it('chama signOut quando clicado', async () => {
    const mockSignOut = vi.fn()
    vi.mocked(useAuth).mockReturnValue({ user: null, signIn: vi.fn(), signOut: mockSignOut })

    const mockWindowLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true,
    })

    const { getByRole } = render(<LogoutButton />)
    const button = getByRole('button')
    fireEvent.click(button)

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockWindowLocation.href).toBe('/')
  })

  it('renderiza com variantes diferentes', () => {
    const { rerender } = render(<LogoutButton variant="destructive" />)
    rerender(<LogoutButton variant="outline" size="lg" />)
  })
})
