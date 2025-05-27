export async function POST(request: Request) {
  const { query } = await request.json()

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query é obrigatória' }), { status: 400 })
  }

  if (query.includes('opinião') || query.includes('explique')) {
    return new Response(JSON.stringify({ error: 'Pergunta inválida' }), { status: 400 })
  }

  return new Response(
    JSON.stringify({
      matches: [
        {
          id: 1,
          title: 'Mezuzá',
          bookId: 'leis-da-casa',
          chapterId: 'capitulo-4',
        },
      ],
    }),
    { status: 200 }
  )
}
