import { render } from '@testing-library/react'
import { ThemeProvider } from '../components/theme-provider'
import { vi } from 'vitest'

// Mock para window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('ThemeProvider', () => {
  it('renderiza sem erros', () => {
    render(
      <ThemeProvider>
        <div>Conteúdo</div>
      </ThemeProvider>
    )
  })
})
