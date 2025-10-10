import { render } from '@testing-library/react'
import { ResizablePanelGroup } from '../components/ui/resizable'

describe('ResizablePanelGroup', () => {
  it('renderiza sem erros', () => {
    render(<ResizablePanelGroup direction="horizontal" />)
  })
})
