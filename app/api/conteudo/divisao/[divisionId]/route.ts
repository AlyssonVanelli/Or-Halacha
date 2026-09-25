import { NextResponse } from 'next/server'
import { getDivisionIndex } from '@/lib/content/server'

// Índice público de um tratado: números e assuntos dos simanim (sem o texto).
export async function GET(_req: Request, { params }: { params: Promise<{ divisionId: string }> }) {
  try {
    const { divisionId } = await params
    if (!/^[0-9a-f-]{36}$/i.test(divisionId)) {
      return NextResponse.json({ error: 'Tratado inválido' }, { status: 400 })
    }

    const index = await getDivisionIndex(divisionId)
    if (!index) {
      return NextResponse.json({ error: 'Tratado não encontrado' }, { status: 404 })
    }

    return NextResponse.json(index, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (error) {
    console.error('Erro ao carregar índice do tratado:', error)
    return NextResponse.json({ error: 'Erro ao carregar o tratado' }, { status: 500 })
  }
}
