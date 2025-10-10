import { render } from '@testing-library/react'
import { AspectRatio } from '../components/ui/aspect-ratio'

describe('AspectRatio', () => {
  it('renderiza sem erros', () => {
    render(<AspectRatio />)
  })
})
