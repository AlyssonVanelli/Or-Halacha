import { render } from '@testing-library/react'
import { UserAuthForm } from '../components/user-auth-form'
import { AuthProvider } from '../contexts/auth-context'

describe('UserAuthForm', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <UserAuthForm type={'login'} />
      </AuthProvider>
    )
  })
})
