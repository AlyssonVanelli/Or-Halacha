import { render } from '@testing-library/react'
import { ParashaSemanal } from '../app/components/parasha-semanal'

describe('ParashaSemanal', () => {
  it('renderiza sem erros', () => {
    const parasha = {
      nome: 'Parasha Teste',
      haftarah: 'Texto da Haftarah',
    }
    render(<ParashaSemanal parasha={parasha} />)
  })

  it('exibe o nome da parasha corretamente', () => {
    const parasha = {
      nome: 'Parasha Teste',
      haftarah: 'Texto da Haftarah',
    }
    const { getByText } = render(<ParashaSemanal parasha={parasha} />)
    expect(getByText('Parasha Teste')).toBeInTheDocument()
  })
})

// Este teste foi comentado pois não existe um componente ParashaSemanal exportado em ../components/ParashaSemanal.
