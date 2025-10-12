import { render } from '@testing-library/react'
import { Skeleton } from '../components/ui/skeleton'

describe('Skeleton', () => {
  it('renderiza sem erros', () => {
    render(<Skeleton />)
  })
})
