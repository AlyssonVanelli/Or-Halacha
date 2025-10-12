import { render } from '@testing-library/react'
import { Textarea } from '../components/ui/textarea'

describe('Textarea', () => {
  it('renderiza sem erros', () => {
    render(<Textarea />)
  })
})
