import { render } from '@testing-library/react'
import { ThemeProvider } from '../components/theme-provider'

describe('ThemeProvider', () => {
  it('renderiza sem erros', () => {
    render(
      <ThemeProvider>
        <div>Conteúdo</div>
      </ThemeProvider>
    )
  })
})
