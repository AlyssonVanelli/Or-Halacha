import { render, fireEvent } from '@testing-library/react'
import FaqAccordion from '../app/components/FaqAccordion'

describe('FaqAccordion', () => {
  it('renderiza sem erros', () => {
    render(<FaqAccordion />)
  })

  it('exibe as perguntas frequentes', () => {
    const { getByText } = render(<FaqAccordion />)
    expect(getByText('O que é o Or Halacha?')).toBeInTheDocument()
    expect(getByText('Como funciona a minha dashboard?')).toBeInTheDocument()
    expect(getByText('Posso sugerir novos conteúdos?')).toBeInTheDocument()
    expect(getByText('Como atualizo meu e-mail ou senha?')).toBeInTheDocument()
  })

  it('expande e colapsa as respostas ao clicar', () => {
    const { getByText, queryByText } = render(<FaqAccordion />)
    const pergunta = getByText('O que é o Or Halacha?')
    fireEvent.click(pergunta)
    expect(
      queryByText(
        'Or Halacha é uma plataforma em Português com ensinamentos e decisões de Halachá, baseada nos quatro tratados do Shulchan Aruch, para facilitar seu estudo e consulta.'
      )
    ).toBeInTheDocument()
    fireEvent.click(pergunta)
    expect(
      queryByText(
        'Or Halacha é uma plataforma em Português com ensinamentos e decisões de Halachá, baseada nos quatro tratados do Shulchan Aruch, para facilitar seu estudo e consulta.'
      )
    ).not.toBeInTheDocument()
  })
})

// Este teste foi comentado pois não existe um componente FaqAccordion exportado em ../components/FaqAccordion.
