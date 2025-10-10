import { render } from '@testing-library/react'
import { Table } from '../components/ui/table'

describe('Table', () => {
  it('renderiza sem erros', () => {
    render(<Table />)
  })
})
