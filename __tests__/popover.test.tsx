import { render } from '@testing-library/react'
import { Popover } from '../components/ui/popover'

describe('Popover', () => {
  it('renderiza sem erros', () => {
    render(<Popover />)
  })
})
