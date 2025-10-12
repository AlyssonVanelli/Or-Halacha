import { render } from '@testing-library/react'
import { Label } from '../components/ui/label'

describe('Label', () => {
  it('renderiza sem erros', () => {
    render(<Label />)
  })
})
