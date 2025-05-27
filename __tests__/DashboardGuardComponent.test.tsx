import { render } from '@testing-library/react'
import DashboardGuard from '../components/DashboardGuard'
import { AuthProvider } from '../contexts/auth-context'

describe('DashboardGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <DashboardGuard>
          <div>Teste</div>
        </DashboardGuard>
      </AuthProvider>
    )
  })
})
