import { render } from '@testing-library/react'
import { Menubar } from '../components/ui/menubar'

describe('Menubar', () => {
  it('renderiza sem erros', () => {
    render(<Menubar />)
  })
})
