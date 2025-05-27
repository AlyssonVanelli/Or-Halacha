import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { vi } from 'vitest'

describe('Button', () => {
  it('deve renderizar o botão com o texto correto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('deve chamar a função onClick quando clicado', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique aqui</Button>)

    fireEvent.click(screen.getByText('Clique aqui'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('deve estar desabilitado quando a prop disabled é true', () => {
    render(<Button disabled>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeDisabled()
  })

  it('deve aplicar variantes de estilo corretamente', () => {
    render(<Button variant="destructive">Clique aqui</Button>)
    const button = screen.getByText('Clique aqui')
    expect(button).toHaveClass('bg-destructive')
  })
})
