import { render } from '@testing-library/react'
import { Avatar } from '../components/ui/avatar'

describe('Avatar', () => {
  it('renderiza sem erros', () => {
    render(<Avatar />)
  })
})
