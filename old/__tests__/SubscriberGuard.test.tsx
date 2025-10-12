import { render } from '@testing-library/react'
import SubscriberGuard from '../components/SubscriberGuard'
import { AuthProvider } from '../contexts/auth-context'

describe('SubscriberGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <SubscriberGuard>
          <div>Conteúdo protegido</div>
        </SubscriberGuard>
      </AuthProvider>
    )
  })
})
