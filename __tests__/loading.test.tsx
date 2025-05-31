import { render } from '@testing-library/react'
import { Loading } from '../components/ui/loading'

describe('Loading', () => {
  it('renderiza sem erros', () => {
    render(<Loading />)
  })
})
