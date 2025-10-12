import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks/useCounter'

describe('useCounter', () => {
  it('deve inicializar com o valor padrão 0', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('deve inicializar com um valor personalizado', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }))
    expect(result.current.count).toBe(5)
  })

  it('deve incrementar o contador', () => {
    const { result } = renderHook(() => useCounter())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it('deve decrementar o contador', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.count).toBe(4)
  })

  it('deve resetar o contador para o valor inicial', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }))

    act(() => {
      result.current.increment()
      result.current.increment()
      result.current.reset()
    })

    expect(result.current.count).toBe(5)
  })
})
