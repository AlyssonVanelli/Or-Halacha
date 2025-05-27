import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert', () => {
  it('deve renderizar o alerta com variante padrão', () => {
    render(
      <Alert>
        <AlertTitle>Título do Alerta</AlertTitle>
        <AlertDescription>Descrição do alerta</AlertDescription>
      </Alert>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Título do Alerta')).toBeInTheDocument()
    expect(screen.getByText('Descrição do alerta')).toBeInTheDocument()
  })

  it('deve renderizar o alerta com variante destrutiva', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Algo deu errado</AlertDescription>
      </Alert>
    )

    const alert = screen.getByRole('alert')
    expect(alert.className).toMatch(/border-destructive/)
  })

  it('deve aplicar classes personalizadas', () => {
    render(
      <Alert className="custom-alert">
        <AlertTitle className="custom-title">Título</AlertTitle>
        <AlertDescription className="custom-description">Descrição</AlertDescription>
      </Alert>
    )

    expect(screen.getByRole('alert')).toHaveClass('custom-alert')
    expect(screen.getByText('Título')).toHaveClass('custom-title')
    expect(screen.getByText('Descrição')).toHaveClass('custom-description')
  })

  it('deve renderizar apenas o título', () => {
    render(
      <Alert>
        <AlertTitle>Apenas título</AlertTitle>
      </Alert>
    )

    expect(screen.getByText('Apenas título')).toBeInTheDocument()
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('deve renderizar apenas a descrição', () => {
    render(
      <Alert>
        <AlertDescription>Apenas descrição</AlertDescription>
      </Alert>
    )

    expect(screen.getByText('Apenas descrição')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
