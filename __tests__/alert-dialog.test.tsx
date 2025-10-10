import { render, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/alert-dialog'

describe('AlertDialog', () => {
  it('renderiza sem erros', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Abrir</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Título</AlertDialogTitle>
            <AlertDialogDescription>Descrição</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  })

  it('abre o diálogo quando o trigger é clicado', () => {
    const { getByText } = render(
      <AlertDialog>
        <AlertDialogTrigger>Abrir</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Título</AlertDialogTitle>
            <AlertDialogDescription>Descrição</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const trigger = getByText('Abrir')
    fireEvent.click(trigger)

    expect(getByText('Título')).toBeInTheDocument()
    expect(getByText('Descrição')).toBeInTheDocument()
  })

  it('chama onAction quando o botão de ação é clicado', () => {
    const onAction = vi.fn()
    const { getByText } = render(
      <AlertDialog>
        <AlertDialogTrigger>Abrir</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Título</AlertDialogTitle>
            <AlertDialogDescription>Descrição</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const trigger = getByText('Abrir')
    fireEvent.click(trigger)

    const actionButton = getByText('Confirmar')
    fireEvent.click(actionButton)

    expect(onAction).toHaveBeenCalled()
  })

  it('chama onCancel quando o botão de cancelar é clicado', () => {
    const onCancel = vi.fn()
    const { getByText } = render(
      <AlertDialog>
        <AlertDialogTrigger>Abrir</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Título</AlertDialogTitle>
            <AlertDialogDescription>Descrição</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const trigger = getByText('Abrir')
    fireEvent.click(trigger)

    const cancelButton = getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
  })
})
