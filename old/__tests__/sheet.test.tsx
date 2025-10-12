import { render } from '@testing-library/react'
import { Sheet } from '../components/ui/sheet'

describe('Sheet', () => {
  it('renderiza sem erros', () => {
    render(<Sheet />)
  })
})
