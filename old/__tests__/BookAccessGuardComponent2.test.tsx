import { render } from '@testing-library/react'
import { BookAccessGuard } from '../components/BookAccessGuard'
import { AuthProvider } from '../contexts/auth-context'

describe('BookAccessGuard', () => {
  it('renderiza sem erros', () => {
    render(
      <AuthProvider>
        <BookAccessGuard bookId="1">
          <div>Teste</div>
        </BookAccessGuard>
      </AuthProvider>
    )
  })
})
