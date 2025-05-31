import { render } from '@testing-library/react'
import { Pagination } from '../components/ui/pagination'

describe('Pagination', () => {
  it('renderiza sem erros', () => {
    render(<Pagination />)
  })
})
