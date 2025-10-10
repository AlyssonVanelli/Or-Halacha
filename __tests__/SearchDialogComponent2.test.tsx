import { render } from '@testing-library/react'
import { SearchDialog } from '../components/SearchDialog'

describe('SearchDialog', () => {
  it('renderiza sem erros', () => {
    render(<SearchDialog />)
  })
})
