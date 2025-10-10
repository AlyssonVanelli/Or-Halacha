import { render } from '@testing-library/react'
import { LogoutButton } from '../components/logout-button'
import { AuthProvider } from '../contexts/auth-context'

describe('LogoutButton', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>
    )
  })
})
