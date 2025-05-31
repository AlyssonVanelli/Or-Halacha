import { render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { fireEvent } from '@testing-library/react'

describe('Form Components', () => {
  const TestForm = () => {
    const form = useForm({
      defaultValues: {
        test: '',
      },
    })

    return (
      <Form {...form}>
        <form>
          <FormField
            control={form.control}
            name="test"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Label</FormLabel>
                <FormControl>
                  <input {...field} />
                </FormControl>
                <FormDescription>Test Description</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    )
  }

  it('deve renderizar todos os componentes do formulário', () => {
    render(<TestForm />)

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('deve mostrar mensagem de erro quando o campo é inválido', async () => {
    const TestFormWithValidation = () => {
      const form = useForm({
        defaultValues: {
          test: '',
        },
      })

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => {})}>
            <FormField
              control={form.control}
              name="test"
              rules={{ required: 'Campo obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Label</FormLabel>
                  <FormControl>
                    <input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button type="submit">Enviar</button>
          </form>
        </Form>
      )
    }

    render(<TestFormWithValidation />)

    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: /enviar/i })

    fireEvent.blur(input)
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
    })
  })

  it('deve usar o hook useFormField corretamente', () => {
    const TestFormWithHook = () => {
      const form = useForm({
        defaultValues: {
          test: '',
        },
      })

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Label</FormLabel>
                  <FormControl>
                    <input {...field} data-testid="test-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )
    }

    render(<TestFormWithHook />)

    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('id')
    expect(input).toHaveAttribute('aria-describedby')
  })
})
