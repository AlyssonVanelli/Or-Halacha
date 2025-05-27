import { vi } from 'vitest'

// Mock do useRouter do Next.js
const mockRouter = { push: vi.fn() }
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

// Mock do contexto de autenticação
vi.mock('../contexts/auth-context', () => ({
  useAuth: vi.fn(),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserAuthForm } from '../components/user-auth-form'
import { AuthProvider } from '../contexts/auth-context'
import { useAuth } from '../contexts/auth-context'

describe('UserAuthForm', () => {
  const mockSignIn = vi.fn()
  const mockSignUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      signIn: mockSignIn,
      signUp: mockSignUp,
      isLoading: false,
    })
  })

  it('deve renderizar o formulário de login corretamente', () => {
    render(
      <AuthProvider>
        <UserAuthForm type="login" />
      </AuthProvider>
    )

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('deve renderizar o formulário de cadastro corretamente', () => {
    render(
      <AuthProvider>
        <UserAuthForm type="signup" />
      </AuthProvider>
    )

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
  })

  it('deve chamar signIn ao submeter o formulário de login', async () => {
    render(
      <AuthProvider>
        <UserAuthForm type="login" />
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('deve chamar signUp ao submeter o formulário de cadastro', async () => {
    render(
      <AuthProvider>
        <UserAuthForm type="signup" />
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('deve mostrar mensagem de erro quando o login falha', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Credenciais inválidas'))

    render(
      <AuthProvider>
        <UserAuthForm type="login" />
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'wrong-password' },
    })

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument()
    })
  })
})
