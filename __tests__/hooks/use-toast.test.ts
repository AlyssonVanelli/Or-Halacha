import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/use-toast'
import { vi } from 'vitest'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  it('deve adicionar um toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Título',
        description: 'Descrição',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Título',
      description: 'Descrição',
    })
  })

  it('deve remover um toast após o tempo definido', async () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Título',
        description: 'Descrição',
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    await act(async () => {
      vi.runAllTimers()
      await Promise.resolve()
      await Promise.resolve()
    })

    // Simula o fechamento do toast
    act(() => {
      result.current.toasts[0]?.onOpenChange?.(false)
    })

    await act(async () => {
      vi.runOnlyPendingTimers()
      await Promise.resolve()
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('deve atualizar um toast existente', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Título Original',
        description: 'Descrição Original',
      })
    })

    act(() => {
      result.current.toast({
        title: 'Título Atualizado',
        description: 'Descrição Atualizada',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Título Atualizado',
      description: 'Descrição Atualizada',
    })
  })

  it('deve remover um toast manualmente', async () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Título',
        description: 'Descrição',
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(result.current.toasts[0].id)
    })

    await act(async () => {
      vi.runOnlyPendingTimers()
      await Promise.resolve()
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('deve limpar todos os toasts', async () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })

    expect(result.current.toasts.length).toBeGreaterThan(0)

    act(() => {
      result.current.dismiss()
      vi.runAllTimers()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.toasts).toHaveLength(0)
  })
})
