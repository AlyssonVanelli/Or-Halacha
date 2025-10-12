import { render } from '@testing-library/react'
import { RadioGroup } from '../components/ui/radio-group'

describe('RadioGroup', () => {
  it('renderiza sem erros', () => {
    render(<RadioGroup />)
  })
})
