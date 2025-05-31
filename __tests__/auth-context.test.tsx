import { render, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/auth-context'
import { vi } from 'vitest'

let onAuthStateChangeCallback: ((event: string, session: any) => void) | null = null

vi.mock('../lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: (cb: any) => {
        onAuthStateChangeCallback = cb
        if (onAuthStateChangeCallback) {
          cb('SIGNED_OUT', { user: null })
        }
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signInWithPassword: vi.fn().mockImplementation(async () => {
        await act(async () => {
          if (onAuthStateChangeCallback) {
            onAuthStateChangeCallback('SIGNED_IN', { user: { id: '1', email: 'test@test.com' } })
          }
        })
        return { error: null }
      }),
      signOut: vi.fn().mockImplementation(async () => {
        await act(async () => {
          if (onAuthStateChangeCallback) {
            onAuthStateChangeCallback('SIGNED_OUT', { user: null })
          }
        })
        return { error: null }
      }),
    },
  }),
}))

// Componente de teste para usar o hook useAuth e expor os métodos nos botões
const TestComponent = () => {
  const { user, signIn, signOut } = useAuth()
  return (
    <div>
      <div data-testid="user">{user ? 'Logado' : 'Deslogado'}</div>
      <button onClick={() => signIn('test@test.com', 'password')}>Login</button>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('renderiza o AuthProvider sem erros', () => {
    render(
      <AuthProvider>
        <div>Teste</div>
      </AuthProvider>
    )
  })

  it('inicia com usuário deslogado', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    expect(getByTestId('user')).toHaveTextContent('Deslogado')
  })

  it('permite login e logout', async () => {
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(getByTestId('user')).toHaveTextContent('Deslogado')

    await act(async () => {
      getByText('Login').click()
    })
    expect(getByTestId('user')).toHaveTextContent('Logado')

    await act(async () => {
      getByText('Logout').click()
    })
    expect(getByTestId('user')).toHaveTextContent('Deslogado')
  })
})
