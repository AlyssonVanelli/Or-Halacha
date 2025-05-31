import { render } from '@testing-library/react'
import { Toast, ToastProvider } from '../components/ui/toast'

describe('Toast', () => {
  it('renderiza sem erros', () => {
    render(
      <ToastProvider>
        <Toast />
      </ToastProvider>
    )
  })
})
