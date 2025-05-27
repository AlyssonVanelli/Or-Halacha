import { render } from '@testing-library/react'
import { Progress } from '../components/ui/progress'

describe('Progress', () => {
  it('renderiza sem erros', () => {
    render(<Progress />)
  })
})
