import { render } from '@testing-library/react'
import { Tooltip } from '../components/ui/tooltip'
import { TooltipProvider } from '../components/ui/tooltip'

describe('Tooltip', () => {
  it('renderiza sem erros', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <div>Teste</div>
        </Tooltip>
      </TooltipProvider>
    )
  })
})
