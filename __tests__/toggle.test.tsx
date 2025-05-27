import { render } from '@testing-library/react'
import { Toggle } from '../components/ui/toggle'

describe('Toggle', () => {
  it('renderiza sem erros', () => {
    render(<Toggle />)
  })
})
