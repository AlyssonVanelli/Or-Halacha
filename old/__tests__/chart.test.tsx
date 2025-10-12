import { render } from '@testing-library/react'
import { Chart } from '../components/ui/chart'
import { vi } from 'vitest'

vi.mock('chart.js', () => {
  const ChartMock = vi.fn() as any
  ChartMock.register = vi.fn()

  return {
    Chart: ChartMock,
    registerables: [],
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    PointElement: vi.fn(),
    LineElement: vi.fn(),
    BarElement: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    __esModule: true,
  }
})

vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(() => null),
  Bar: vi.fn(() => null),
  __esModule: true,
}))

describe('Chart', () => {
  it('deve renderizar o gráfico com dados vazios', () => {
    const data = {
      labels: [],
      datasets: [],
    }
    const { container } = render(<Chart data={data} />)
    expect(container).toBeInTheDocument()
  })

  it('deve renderizar o gráfico com dados', () => {
    const data = {
      labels: ['Teste 1', 'Teste 2'],
      datasets: [
        {
          label: 'Valores',
          data: [10, 20],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    }
    const { container } = render(<Chart data={data} />)
    expect(container).toBeInTheDocument()
  })

  it('deve atualizar o gráfico quando os dados mudam', () => {
    const data = {
      labels: ['Teste 1', 'Teste 2'],
      datasets: [
        {
          label: 'Valores',
          data: [10, 20],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    }
    const { container, rerender } = render(<Chart data={data} />)

    const newData = {
      labels: ['Teste 3', 'Teste 4'],
      datasets: [
        {
          label: 'Valores',
          data: [30, 40],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    }

    rerender(<Chart data={newData} />)
    expect(container).toBeInTheDocument()
  })
})
