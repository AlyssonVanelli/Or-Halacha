import { render } from '@testing-library/react'
import { Slider } from '../components/ui/slider'

// Mock para ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('Slider', () => {
  it('renderiza sem erros', () => {
    render(<Slider />)
  })
})
