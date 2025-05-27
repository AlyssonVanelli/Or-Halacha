import { render } from '@testing-library/react'
import AdminGuard from '../components/AdminGuard'
import { AuthProvider } from '../contexts/auth-context'

describe('AdminGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <AdminGuard>
          <div>Teste</div>
        </AdminGuard>
      </AuthProvider>
    )
  })
})
