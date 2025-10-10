import { render } from '@testing-library/react'
import { Alert } from '../components/ui/alert'

describe('Alert', () => {
  it('renderiza sem erros', () => {
    render(<Alert />)
  })
})
