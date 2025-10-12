import 'whatwg-fetch'
import { POST } from '@/app/api/search/route'

describe('Search API', () => {
  it('deve rejeitar requisições sem query', async () => {
    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Query é obrigatória')
  })

  it('deve rejeitar perguntas inválidas', async () => {
    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'qual sua opinião sobre shabat?' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Pergunta inválida')
  })

  it('deve retornar resultados para perguntas válidas', async () => {
    const request = new Request('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'onde encontro as leis de mezuzá?' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.matches).toHaveLength(1)
    expect(data.matches[0]).toEqual({
      id: 1,
      title: 'Mezuzá',
      bookId: 'leis-da-casa',
      chapterId: 'capitulo-4',
    })
  })
})
