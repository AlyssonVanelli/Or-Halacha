import { render, screen, waitFor } from '@testing-library/react'
import DashboardGuard from '../components/DashboardGuard'
import { vi } from 'vitest'

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock do Supabase para sempre retornar admin
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { is_admin: true } }),
        }),
      }),
    }),
  }),
}))

// Mock do DB para garantir assinatura ativa
vi.mock('@/lib/db', () => ({
  db: {
    subscriptions: {
      getActiveByUserId: vi.fn().mockResolvedValue({ id: 'sub1', userId: '1' }),
    },
  },
}))

// Mock dinâmico para useAuth
let mockAuth: any = {
  user: {
    id: '1',
    email: 'test@test.com',
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
  loading: false,
}
vi.mock('../contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockAuth,
}))

describe('DashboardGuard', () => {
  beforeEach(() => {
    mockRouter.push.mockClear()
    mockAuth = {
      user: {
        id: '1',
        email: 'test@test.com',
      },
      signIn: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    }
  })

  it('deve renderizar o conteúdo quando o usuário está autenticado', async () => {
    mockAuth = {
      user: {
        id: '1',
        email: 'test@test.com',
      },
      signIn: vi.fn(),
      signOut: vi.fn(),
      loading: false,
    }
    render(
      <DashboardGuard>
        <div data-testid="conteudo-protegido">Conteúdo Protegido</div>
      </DashboardGuard>
    )
    await waitFor(() => {
      expect(screen.getByTestId('conteudo-protegido')).toBeInTheDocument()
    })
  })

  it('deve redirecionar quando o usuário não está autenticado', async () => {
    mockAuth = { user: null, signIn: vi.fn(), signOut: vi.fn(), loading: false }
    render(
      <DashboardGuard>
        <div>Conteúdo Protegido</div>
      </DashboardGuard>
    )
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })

  it('deve mostrar loading quando está carregando', () => {
    mockAuth = { user: null, signIn: vi.fn(), signOut: vi.fn(), loading: true }
    render(
      <DashboardGuard>
        <div>Conteúdo Protegido</div>
      </DashboardGuard>
    )
    // Busca pelo spinner via classe utilitária do Tailwind
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
