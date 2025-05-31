import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SupportPage from '@/app/suporte/page'
import { AuthProvider } from '../../../contexts/AuthContext'
import { vi } from 'vitest'
import { SUPPORT_CONFIG, SUPPORT_MESSAGES } from '@/constants/support'

interface MockAuthUser {
  user: { email: string } | null
  loading: boolean
}

interface MockResponse {
  ok: boolean
  json: () => Promise<{ success?: boolean; error?: string }>
}

// Mock do AuthProvider e useAuth
const mockAuthUser: MockAuthUser = { user: { email: 'test@example.com' }, loading: false }
vi.mock('@/contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockAuthUser,
}))

describe('SupportPage', () => {
  beforeEach(() => {
    ;(global.fetch as any) = vi.fn()
    ;(global.fetch as any).mockClear()
    mockAuthUser.user = { email: 'test@example.com' }
  })

  function renderWithProvider(ui: React.ReactElement) {
    return render(<AuthProvider>{ui}</AuthProvider>)
  }

  it('deve renderizar a página corretamente', () => {
    renderWithProvider(<SupportPage />)
    expect(screen.getByText(/Como podemos ajudar/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(SUPPORT_MESSAGES.PLACEHOLDER)).toBeInTheDocument()
  })

  it('deve validar mensagem muito curta', async () => {
    renderWithProvider(<SupportPage />)
    const textarea = screen.getByPlaceholderText(SUPPORT_MESSAGES.PLACEHOLDER)
    const submitButton = screen.getByRole('button', { name: /enviar/i })
    fireEvent.change(textarea, { target: { value: 'curta' } })
    fireEvent.click(submitButton)
    expect(await screen.findByText(SUPPORT_MESSAGES.MIN_LENGTH)).toBeInTheDocument()
  })

  it('deve validar mensagem muito longa', async () => {
    renderWithProvider(<SupportPage />)
    const textarea = screen.getByPlaceholderText(SUPPORT_MESSAGES.PLACEHOLDER)
    const submitButton = screen.getByRole('button', { name: /enviar/i })
    fireEvent.change(textarea, {
      target: { value: 'a'.repeat(SUPPORT_CONFIG.MAX_MESSAGE_LENGTH + 1) },
    })
    fireEvent.click(submitButton)
    expect(await screen.findByText(SUPPORT_MESSAGES.MAX_LENGTH)).toBeInTheDocument()
  })

  it('deve enviar mensagem com sucesso', async () => {
    const mockResponse: MockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }
    const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse)
    ;(global.fetch as any) = mockFetch
    renderWithProvider(<SupportPage />)
    const textarea = screen.getByPlaceholderText(SUPPORT_MESSAGES.PLACEHOLDER)
    const submitButton = screen.getByRole('button', { name: /enviar/i })
    fireEvent.change(textarea, { target: { value: 'Mensagem válida com mais de 10 caracteres' } })
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText(SUPPORT_MESSAGES.SUCCESS.TITLE)).toBeInTheDocument()
    })
  })

  it('deve lidar com erro no envio', async () => {
    const mockResponse: MockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Erro no servidor' }),
    }
    const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse)
    ;(global.fetch as any) = mockFetch
    renderWithProvider(<SupportPage />)
    const textarea = screen.getByPlaceholderText(SUPPORT_MESSAGES.PLACEHOLDER)
    const submitButton = screen.getByRole('button', { name: /enviar/i })
    fireEvent.change(textarea, { target: { value: 'Mensagem válida com mais de 10 caracteres' } })
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Por favor, tente novamente mais tarde.')).toBeInTheDocument()
    })
  })

  it('não deve permitir envio sem usuário autenticado', () => {
    mockAuthUser.user = null
    renderWithProvider(<SupportPage />)
    expect(screen.getByText('Acesso Restrito')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /enviar/i })).not.toBeInTheDocument()
    mockAuthUser.user = { email: 'test@example.com' }
  })
})
