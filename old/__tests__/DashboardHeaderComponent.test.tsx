import { render, screen } from '@testing-library/react'
import { DashboardHeader } from '../components/DashboardHeader'
import { AuthProvider } from '../contexts/AuthContext'
import { vi } from 'vitest'

vi.mock('../contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: { email: 'test@example.com' }, loading: false }),
}))

describe('DashboardHeader', () => {
  it('renderiza corretamente os links principais', () => {
    render(
      <AuthProvider>
        <DashboardHeader />
      </AuthProvider>
    )
    expect(screen.getByText('Or Halacha')).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument()
    expect(screen.getByText('Livros')).toBeInTheDocument()
    expect(screen.getByText('Planos')).toBeInTheDocument()
    expect(screen.getByText('Suporte')).toBeInTheDocument()
  })
})
