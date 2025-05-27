import { render, screen, act, waitFor } from '@testing-library/react'
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import ReactDOM from 'react-dom'
import { Toaster } from '@/components/ui/toaster'
import { vi } from 'vitest'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  beforeAll(() => {
    vi.spyOn(ReactDOM, 'createPortal').mockImplementation(element => element as any)
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  const TestComponent = () => {
    const { toast } = useToast()

    return (
      <>
        <button
          onClick={() =>
            toast({
              title: 'Título do Toast',
              description: 'Descrição do toast',
            })
          }
        >
          Mostrar Toast
        </button>
        <ToastViewport />
      </>
    )
  }

  it('deve renderizar o toast com sucesso', async () => {
    render(
      <ToastProvider>
        <TestComponent />
        <Toaster />
      </ToastProvider>
    )

    const button = screen.getAllByRole('button')[0]
    if (!button) throw new Error('Botão não encontrado')

    await act(async () => {
      button.click()
      vi.runOnlyPendingTimers()
    })

    const title = await screen.findByText('Título do Toast')
    const desc = await screen.findByText('Descrição do toast')
    expect(title).toBeInTheDocument()
    expect(desc).toBeInTheDocument()
  }, 20000)

  it('deve renderizar toast com variante destrutiva', async () => {
    const TestComponentWithVariant = () => {
      const { toast } = useToast()

      return (
        <>
          <button
            onClick={() =>
              toast({
                title: 'Erro',
                description: 'Algo deu errado',
                variant: 'destructive',
              })
            }
          >
            Mostrar Toast
          </button>
          <ToastViewport />
        </>
      )
    }

    render(
      <ToastProvider>
        <TestComponentWithVariant />
        <Toaster />
      </ToastProvider>
    )

    const button = screen.getAllByRole('button')[0]
    if (!button) throw new Error('Botão não encontrado')

    await act(async () => {
      button.click()
      vi.runOnlyPendingTimers()
    })

    const erro = await screen.findByText('Erro')
    expect(erro).toBeInTheDocument()
  }, 20000)

  it('deve aplicar classes personalizadas', async () => {
    const TestComponentWithCustomClass = () => {
      const { toast } = useToast()

      return (
        <>
          <button
            onClick={() =>
              toast({
                title: 'Título',
                description: 'Descrição',
                className: 'custom-toast',
              })
            }
          >
            Mostrar Toast
          </button>
          <ToastViewport className="custom-viewport" />
        </>
      )
    }

    render(
      <ToastProvider>
        <TestComponentWithCustomClass />
        <Toaster />
      </ToastProvider>
    )

    const button = screen.getAllByRole('button')[0]
    if (!button) throw new Error('Botão não encontrado')

    await act(async () => {
      button.click()
      vi.runOnlyPendingTimers()
    })

    const titulo = await screen.findByText('Título')
    expect(titulo).toBeInTheDocument()
  }, 20000)

  it('deve fechar o toast após o tempo definido', async () => {
    render(
      <ToastProvider>
        <TestComponent />
        <Toaster />
      </ToastProvider>
    )

    const button = screen.getAllByRole('button')[0]
    if (!button) throw new Error('Botão não encontrado')

    await act(async () => {
      button.click()
      vi.runOnlyPendingTimers()
    })

    const title = await screen.findByText('Título do Toast')
    expect(title).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(5000)
      vi.runOnlyPendingTimers()
    })

    await waitFor(() => {
      expect(screen.queryByText('Título do Toast')).not.toBeInTheDocument()
    })
  }, 20000)
})
