import { render } from '@testing-library/react'
import { BookAccessGuard } from '../components/BookAccessGuard'
import { AuthProvider } from '../contexts/AuthContext'
import { vi } from 'vitest'

vi.mock('../contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: { email: 'test@example.com' }, loading: false }),
}))

describe('BookAccessGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <BookAccessGuard bookId="1">
          <div>Conteúdo protegido</div>
        </BookAccessGuard>
      </AuthProvider>
    )
  })
})
