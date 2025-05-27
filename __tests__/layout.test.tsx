import { render } from '@testing-library/react'
import Layout from '../app/layout'

describe('Layout', () => {
  it('renderiza sem erros', () => {
    render(
      <Layout>
        <div>Conteúdo de teste</div>
      </Layout>
    )
  })

  it('renderiza o conteúdo filho', () => {
    const { container } = render(
      <Layout>
        <div>Conteúdo de teste</div>
      </Layout>
    )
    const body = container.querySelector('body')
    expect(body).toHaveTextContent('Conteúdo de teste')
  })
})
