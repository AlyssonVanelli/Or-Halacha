import { render } from '@testing-library/react'
import { ToggleGroup } from '../components/ui/toggle-group'
import { TooltipProvider } from '../components/ui/tooltip'

describe('ToggleGroup', () => {
  it('renderiza sem erros', () => {
    render(
      <TooltipProvider>
        <ToggleGroup type="single" />
      </TooltipProvider>
    )
  })
})
