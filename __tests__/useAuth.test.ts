import { renderHook } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'
import { vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn().mockImplementation(cb => {
        cb('SIGNED_OUT', { user: null })
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
  },
}))

describe('useAuth', () => {
  it('executa sem erros', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current).toBeDefined()
  })
})
