import '@testing-library/jest-dom'

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock do crypto.randomUUID
Object.defineProperty(global.crypto, 'randomUUID', {
  value: () => 'test-uuid',
})

// Mock do useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// --- Remova ou comente este bloco ---
// const ResponseMock = jest.fn().mockImplementation((body, init) => ({ ... }))
// ResponseMock.error = ...
// ResponseMock.json = ...
// ResponseMock.redirect = ...
// global.Response = ResponseMock

// --- Remova ou comente este bloco ---
// const ResponseMock = jest.fn().mockImplementation((body, init) => ({ ... }))
// ResponseMock.error = ...
// ResponseMock.json = ...
// ResponseMock.redirect = ...
// global.Response = ResponseMock
