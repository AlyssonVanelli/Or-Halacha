require('whatwg-fetch')

import '@testing-library/jest-dom'
import { vi } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-fake'

global.fetch =
  global.fetch ||
  jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      status: 200,
    })
  )

// Limpa todos os mocks após cada teste
afterEach(() => {
  vi.clearAllMocks()
})

// Mock do matchMedia
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

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock do crypto.randomUUID
Object.defineProperty(global.crypto, 'randomUUID', {
  value: () => 'test-uuid',
})

// Mock do next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: vi.fn() }),
}))

// Mock do next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock do process.env
process.env.JWT_SECRET = 'test-secret'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Corrigir mock do Response para evitar erros de tipagem
if (typeof global.Response === 'undefined') {
  global.Response = class {
    constructor() {}
    static error() {
      return new global.Response()
    }
    static json(data: any) {
      return new global.Response()
    }
    static redirect(url: string, status?: number) {
      return new global.Response()
    }
  } as any
}

// Corrigir mock do TextDecoder/TextEncoder para evitar conflitos de tipos
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder
}
