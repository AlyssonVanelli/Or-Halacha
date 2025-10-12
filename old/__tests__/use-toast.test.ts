import { renderHook } from '@testing-library/react'
import { useToast } from '../components/ui/use-toast'

describe('useToast', () => {
  it('executa sem erros', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current).toBeDefined()
  })
})
