import { NextResponse } from 'next/server'
import { getSimanDoDia } from '@/app/lib/siman-do-dia'

export async function GET() {
  try {
    const siman = await getSimanDoDia()
    return NextResponse.json(siman)
  } catch (error) {
    console.error('Erro ao buscar siman do dia:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
