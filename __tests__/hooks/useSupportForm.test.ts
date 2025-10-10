import { renderHook, act } from '@testing-library/react'
import { useSupportForm } from '@/hooks/useSupportForm'
import { SUPPORT_MESSAGES, SUPPORT_CONFIG } from '@/constants/support'
import { vi } from 'vitest'

// Mock do useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('useSupportForm', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => useSupportForm())

    expect(result.current.message).toBe('')
    expect(result.current.status).toBe('idle')
    expect(result.current.errorMessage).toBe('')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('deve atualizar a mensagem', () => {
    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('Nova mensagem')
    })

    expect(result.current.message).toBe('Nova mensagem')
  })

  it('deve validar mensagem muito curta', async () => {
    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('curta')
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
    })

    expect(result.current.errorMessage).toBe(SUPPORT_MESSAGES.MIN_LENGTH)
    expect(result.current.status).toBe('idle')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('deve validar mensagem muito longa', async () => {
    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('a'.repeat(SUPPORT_CONFIG.MAX_MESSAGE_LENGTH + 1))
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
    })

    expect(result.current.errorMessage).toBe(SUPPORT_MESSAGES.MAX_LENGTH)
    expect(result.current.status).toBe('idle')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('deve enviar mensagem com sucesso', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('Mensagem válida com mais de 10 caracteres')
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
    })

    expect(result.current.status).toBe('sent')
    expect(result.current.errorMessage).toBe('')
    expect(result.current.isSubmitting).toBe(false)
    expect(global.fetch).toHaveBeenCalledWith('/api/support/create-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Mensagem válida com mais de 10 caracteres' }),
    })
  })

  it('deve lidar com erro no envio', async () => {
    const mockResponse = { ok: false, json: () => Promise.resolve({ error: 'Erro no servidor' }) }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('Mensagem válida com mais de 10 caracteres')
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('deve lidar com erro de rede', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Erro de rede'))

    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('Mensagem válida com mais de 10 caracteres')
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('deve resetar o formulário', () => {
    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('Mensagem de teste')
      result.current.resetForm()
    })

    expect(result.current.message).toBe('')
    expect(result.current.status).toBe('idle')
    expect(result.current.errorMessage).toBe('')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('não deve permitir múltiplos envios simultâneos', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSupportForm())

    act(() => {
      result.current.setMessage('Mensagem válida com mais de 10 caracteres')
    })

    // Inicia o envio, mas não aguarda o término
    let submitPromise: Promise<void> = Promise.resolve()
    await act(async () => {
      submitPromise = result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      // Checa imediatamente após o início
      expect(result.current.isSubmitting).toBe(true)
    })

    // Tenta enviar novamente enquanto o primeiro envio ainda está em andamento
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    await submitPromise
  })
})
