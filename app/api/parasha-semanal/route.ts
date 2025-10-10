import { NextResponse } from 'next/server'
import { getParashaSemanal } from '@/app/lib/parasha-semanal'

export async function GET() {
  try {
    const parasha = await getParashaSemanal()
    return NextResponse.json(parasha)
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
