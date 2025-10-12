import { render } from '@testing-library/react'
import { Breadcrumb } from '../components/ui/breadcrumb'

describe('Breadcrumb', () => {
  it('renderiza sem erros', () => {
    render(<Breadcrumb />)
  })
})
