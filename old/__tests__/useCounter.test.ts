import { renderHook } from '@testing-library/react'
import { useCounter } from '../hooks/useCounter'

describe('useCounter', () => {
  it('executa sem erros', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current).toBeDefined()
  })
})
