import { render } from '@testing-library/react'
import { Sidebar } from '../components/ui/sidebar'
import { SidebarProvider } from '../components/ui/sidebar'
import { vi } from 'vitest'

// Mock para window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('Sidebar', () => {
  it('renderiza sem erros', () => {
    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    )
  })
})
