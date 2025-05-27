import { renderHook } from '@testing-library/react'
import { useIsMobile } from '../hooks/use-mobile'
import { vi } from 'vitest'

describe('UseMobile', () => {
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

  it('renderiza sem erros', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBeDefined()
  })
})
