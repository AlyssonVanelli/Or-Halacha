import { render } from '@testing-library/react'
import { ErrorMessage } from '../components/ui/error-message'

describe('ErrorMessage', () => {
  it('renderiza com título', () => {
    render(<ErrorMessage title="Erro" />)
  })
})
