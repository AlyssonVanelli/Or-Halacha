import { render } from '@testing-library/react'
import { ScrollArea } from '../components/ui/scroll-area'

describe('ScrollArea', () => {
  it('renderiza sem erros', () => {
    render(<ScrollArea />)
  })
})
