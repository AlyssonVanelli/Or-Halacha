import { render } from '@testing-library/react'
import { Collapsible } from '../components/ui/collapsible'

describe('Collapsible', () => {
  it('renderiza sem erros', () => {
    render(<Collapsible />)
  })
})
