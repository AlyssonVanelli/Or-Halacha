import { render } from '@testing-library/react'
import { Badge } from '../components/ui/badge'

describe('Badge', () => {
  it('renderiza sem erros', () => {
    render(<Badge />)
  })
})
