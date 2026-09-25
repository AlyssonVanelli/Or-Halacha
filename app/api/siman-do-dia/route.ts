import { NextResponse } from 'next/server'
import { getSimanDoDia } from '@/app/lib/siman-do-dia'

export async function GET() {
  try {
    const siman = await getSimanDoDia()
    return NextResponse.json(siman, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
