import { render } from '@testing-library/react'
import { SimanDoDia } from '../app/components/siman-do-dia'

describe('SimanDoDia', () => {
  it('renderiza sem erros', () => {
    const siman = {
      numero: 1,
      titulo: 'Título do Siman',
      livro: 'Orach Chaim',
      texto: 'Texto do Siman',
    }
    render(<SimanDoDia siman={siman} />)
  })

  it('exibe o número do siman corretamente', () => {
    const siman = {
      numero: 1,
      titulo: 'Título do Siman',
      livro: 'Orach Chaim',
      texto: 'Texto do Siman',
    }
    const { getByText } = render(<SimanDoDia siman={siman} />)
    expect(getByText('Siman 1')).toBeInTheDocument()
  })
})
