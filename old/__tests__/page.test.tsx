import { render } from '@testing-library/react'
import Page from '../app/page'
import { getParashaSemanal } from '../app/lib/parasha-semanal'
import { getSimanDoDia } from '../app/lib/siman-do-dia'
import { vi } from 'vitest'

// Mock das funções assíncronas
vi.mock('../app/lib/parasha-semanal', () => ({
  getParashaSemanal: vi.fn().mockResolvedValue({
    nome: 'Parasha Teste',
    trecho: 'Trecho de teste',
  }),
}))

vi.mock('../app/lib/siman-do-dia', () => ({
  getSimanDoDia: vi.fn().mockResolvedValue({
    siman: 'Siman Teste',
    trecho: 'Trecho de siman',
  }),
}))

describe('Página Inicial', () => {
  it('renderiza sem erros', async () => {
    const { container } = render(await Page())
    expect(container).toBeTruthy()
  })

  it('chama as funções assíncronas corretamente', async () => {
    await Page()
    expect(getParashaSemanal).toHaveBeenCalled()
    expect(getSimanDoDia).toHaveBeenCalled()
  })
})

// Este teste foi comentado pois não existe um componente Page exportado em ../components/Page.
