import { render } from '@testing-library/react'
import { RouteGuard } from '../components/route-guard'
import { AuthProvider } from '../contexts/AuthContext'
import { vi } from 'vitest'

vi.mock('../contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: { email: 'test@example.com' }, loading: false }),
}))

describe('RouteGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <RouteGuard>
          <div>Teste</div>
        </RouteGuard>
      </AuthProvider>
    )
  })
})
