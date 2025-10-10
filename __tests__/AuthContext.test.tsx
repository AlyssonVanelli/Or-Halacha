import { render } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import { vi } from 'vitest'

vi.mock('../contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: { email: 'test@example.com' }, loading: false }),
}))

describe('AuthContext', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <div>Teste</div>
      </AuthProvider>
    )
  })
})
