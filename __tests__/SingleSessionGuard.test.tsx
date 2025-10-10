import { render } from '@testing-library/react'
import { SingleSessionGuard } from '../app/components/SingleSessionGuard'
import { AuthProvider } from '../contexts/auth-context'

describe('SingleSessionGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <SingleSessionGuard>
          <div>Teste</div>
        </SingleSessionGuard>
      </AuthProvider>
    )
  })
})
