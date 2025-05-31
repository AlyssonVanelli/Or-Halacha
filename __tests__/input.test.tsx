import { render } from '@testing-library/react'
import { Input } from '../components/ui/input'

describe('Input', () => {
  it('renderiza sem erros', () => {
    render(<Input />)
  })
})
