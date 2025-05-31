import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { vi } from 'vitest'

// Mock do supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve inicializar com valores padrão', () => {
    const mockSubscription = { unsubscribe: vi.fn() }
    ;(supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: mockSubscription },
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('deve atualizar o usuário quando autenticado', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
    }

    const mockSubscription = { unsubscribe: vi.fn() }
    let mockCallback: any
    ;(supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      mockCallback = callback
      return {
        data: { subscription: mockSubscription },
      }
    })

    const { result } = renderHook(() => useAuth())

    act(() => {
      mockCallback('SIGNED_IN', { user: mockUser })
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.loading).toBe(false)
  })

  it('deve limpar o usuário quando deslogado', () => {
    const mockSubscription = { unsubscribe: vi.fn() }
    let mockCallback: any
    ;(supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      mockCallback = callback
      return {
        data: { subscription: mockSubscription },
      }
    })

    const { result } = renderHook(() => useAuth())

    act(() => {
      mockCallback('SIGNED_OUT', null)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('deve limpar a subscription ao desmontar', () => {
    const mockUnsubscribe = vi.fn()
    const mockSubscription = { unsubscribe: mockUnsubscribe }

    ;(supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: mockSubscription },
    })

    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
