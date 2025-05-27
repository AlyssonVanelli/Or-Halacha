import { render, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SearchDialog } from '../components/SearchDialog'
import { SearchProvider } from '../contexts/SearchContext'

// Definir mockRouter no escopo global
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

describe('SearchDialog', () => {
  beforeEach(() => {
    vi.mock('next/navigation', () => ({
      useRouter: () => mockRouter,
    }))
  })

  it('renderiza sem erros', () => {
    render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )
  })

  it('atualiza o input quando digitado', () => {
    const { getByRole } = render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )

    const input = getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'teste' } })
    expect(input).toHaveValue('teste')
  })

  it('não faz busca com query vazia', async () => {
    const { getByRole } = render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )

    const form = getByRole('search')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  it('mostra erro quando a busca falha', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Erro de rede'))

    const { getByRole, findByRole } = render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )

    const input = getByRole('searchbox')
    const form = getByRole('search')

    fireEvent.change(input, { target: { value: 'teste' } })
    fireEvent.submit(form)

    const errorMessage = await findByRole('alert')
    expect(errorMessage).toHaveTextContent('Erro ao buscar')
  })

  it('redireciona para o primeiro resultado quando encontrado', async () => {
    const mockResults = {
      matches: [
        {
          bookId: '1',
          chapterId: '2',
        },
      ],
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })

    const { getByRole } = render(
      <SearchProvider>
        <SearchDialog />
      </SearchProvider>
    )

    const input = getByRole('searchbox')
    const form = getByRole('search')

    fireEvent.change(input, { target: { value: 'teste' } })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/livros/1/capitulos/2')
    })
  })
})
