import { render } from '@testing-library/react'
import { Select } from '../components/ui/select'

describe('Select', () => {
  it('renderiza sem erros', () => {
    render(<Select />)
  })
})
