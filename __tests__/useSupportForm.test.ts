import { renderHook } from '@testing-library/react'
import { useSupportForm } from '../hooks/useSupportForm'

describe('useSupportForm', () => {
  it('executa sem erros', () => {
    const { result } = renderHook(() => useSupportForm())
    expect(result.current).toBeDefined()
  })
})
