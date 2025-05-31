import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SearchDialog } from '@/components/SearchDialog'
import { SearchProvider } from '@/contexts/SearchContext'

expect.extend(toHaveNoViolations)

describe('Acessibilidade da Busca', () => {
  it('deve passar nos testes de acessibilidade', async () => {
    const { container } = render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('deve ter roles apropriados', () => {
    render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )

    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('deve ter labels apropriados', () => {
    render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )

    expect(screen.getByLabelText(/buscar halachá/i)).toBeInTheDocument()
  })
})
