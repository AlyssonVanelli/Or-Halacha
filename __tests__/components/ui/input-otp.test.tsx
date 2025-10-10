import { render, screen } from '@testing-library/react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

// Mock global do ResizeObserver para ambiente de teste
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('InputOTP', () => {
  it('deve renderizar o componente corretamente', () => {
    render(
      <InputOTP maxLength={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    )

    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('deve aplicar classes personalizadas', () => {
    render(
      <InputOTP maxLength={4} className="custom-class" containerClassName="container-class">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    )

    const container = document.querySelector('[data-input-otp-container]') as HTMLElement
    expect(container).toHaveClass('container-class')

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveClass('custom-class')
    })
  })

  it('deve lidar com estado desabilitado', () => {
    render(
      <InputOTP maxLength={4} disabled>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    )

    const container = document.querySelector('[data-input-otp-container]') as HTMLElement
    expect(container).toHaveClass('has-[:disabled]:opacity-50')

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toBeDisabled()
    })
  })

  it('deve renderizar slots com valores', () => {
    render(
      <InputOTP maxLength={4} value="1234">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    )

    const inputs = screen.getAllByRole('textbox')
    expect((inputs[0] as HTMLInputElement).value[0]).toBe('1')
    expect((inputs[0] as HTMLInputElement).value[1]).toBe('2')
    expect((inputs[0] as HTMLInputElement).value[2]).toBe('3')
    expect((inputs[0] as HTMLInputElement).value[3]).toBe('4')
  })
})
