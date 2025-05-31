import { GET } from '@/app/api/hello/route'
import { vi } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any) => ({
      json: () => Promise.resolve(data),
    }),
  },
}))

interface NextRequest {
  nextUrl: {
    searchParams: URLSearchParams
  }
}

declare global {
  var NextRequest: new () => NextRequest
}

let originalResponse: any

beforeAll(() => {
  global.NextRequest = class implements NextRequest {
    nextUrl: { searchParams: URLSearchParams }
    constructor() {
      this.nextUrl = { searchParams: new URLSearchParams() }
    }
  }
  originalResponse = globalThis.Response
  globalThis.Response = class {
    constructor(private data: any) {}
    json() {
      return Promise.resolve(this.data)
    }
  } as any
})

afterAll(() => {
  globalThis.Response = originalResponse
})

it('deve retornar uma mensagem de saudação', async () => {
  const request = new MockNextRequest()
  const response = await GET(request as any)
  const data = await response.json()
  expect(data.message).toBe('Olá, mundo!')
})

it('deve incluir o nome na mensagem quando fornecido', async () => {
  const request = new MockNextRequest({ name: 'João' })
  const response = await GET(request as any)
  const data = await response.json()
  expect(data.message).toBe('Olá, João!')
})

class MockNextRequest {
  nextUrl: { searchParams: URLSearchParams }
  constructor(params?: Record<string, string>) {
    this.nextUrl = { searchParams: new URLSearchParams(params) }
  }
}
