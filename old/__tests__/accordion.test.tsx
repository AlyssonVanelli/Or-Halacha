import { render } from '@testing-library/react'
import { Accordion } from '../components/ui/accordion'

describe('Accordion', () => {
  it('renderiza sem erros', () => {
    render(<Accordion />)
  })
})
