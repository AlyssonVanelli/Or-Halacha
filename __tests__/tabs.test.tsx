import { render } from '@testing-library/react'
import { Tabs } from '../components/ui/tabs'

describe('Tabs', () => {
  it('renderiza sem erros', () => {
    render(<Tabs />)
  })
})
