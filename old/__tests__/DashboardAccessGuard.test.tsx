import { render } from '@testing-library/react'
import { DashboardAccessGuard } from '../components/DashboardAccessGuard'
import { AuthProvider } from '../contexts/auth-context'

describe('DashboardAccessGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <DashboardAccessGuard>
          <div>Conteúdo protegido</div>
        </DashboardAccessGuard>
      </AuthProvider>
    )
  })
})
