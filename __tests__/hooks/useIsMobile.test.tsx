import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { vi } from 'vitest'

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth
  const originalMatchMedia = window.matchMedia
  let mqlMock: any

  beforeEach(() => {
    mqlMock = {
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    window.matchMedia = vi.fn().mockImplementation(() => mqlMock)
    vi.clearAllMocks()
  })

  afterEach(() => {
    window.innerWidth = originalInnerWidth
    window.matchMedia = originalMatchMedia
    vi.clearAllMocks()
  })

  it('deve retornar true para telas menores que 768px', () => {
    window.innerWidth = 767
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('deve retornar false para telas maiores que 768px', () => {
    window.innerWidth = 769
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('deve atualizar quando a largura da tela muda', () => {
    window.innerWidth = 500
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    act(() => {
      window.innerWidth = 1200
      mqlMock.addEventListener.mock.calls[0][1]() // simula o evento 'change'
    })

    expect(result.current).toBe(false)
  })

  it('deve limpar o event listener ao desmontar', () => {
    const removeEventListenerSpy = vi.spyOn(mqlMock, 'removeEventListener')
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})
