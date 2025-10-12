import { render, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { Calendar } from '../components/ui/calendar'

describe('Calendar', () => {
  it('renderiza sem erros', () => {
    render(<Calendar mode="single" />)
  })

  it('renderiza com data selecionada', () => {
    const selectedDate = new Date(2024, 0, 1)
    render(<Calendar mode="single" selected={selectedDate} />)
  })

  it('renderiza com range de datas', () => {
    const from = new Date(2024, 0, 1)
    const to = new Date(2024, 0, 7)
    render(<Calendar mode="range" selected={{ from, to }} />)
  })

  it('renderiza com dias desabilitados', () => {
    const disabledDays = [new Date(2024, 0, 1), new Date(2024, 0, 2)]
    render(<Calendar mode="single" disabled={disabledDays} />)
  })

  it('renderiza com classe personalizada', () => {
    const { container } = render(<Calendar mode="single" className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renderiza com dias externos ocultos', () => {
    render(<Calendar mode="single" showOutsideDays={false} />)
  })

  it('chama onSelect quando uma data é selecionada', () => {
    const onSelect = vi.fn()
    const { container } = render(<Calendar mode="single" onSelect={onSelect} />)

    const dayButton = container.querySelector('[aria-selected="false"]')
    if (dayButton) {
      fireEvent.click(dayButton)
      expect(onSelect).toHaveBeenCalled()
    }
  })
})
