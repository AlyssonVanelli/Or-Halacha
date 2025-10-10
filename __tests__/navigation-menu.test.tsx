import { render } from '@testing-library/react'
import { NavigationMenu } from '../components/ui/navigation-menu'

describe('NavigationMenu', () => {
  it('renderiza sem erros', () => {
    render(<NavigationMenu />)
  })
})
