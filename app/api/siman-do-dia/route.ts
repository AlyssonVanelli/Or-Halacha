import { NextResponse } from 'next/server'
import { getSimanDoDia } from '@/app/lib/siman-do-dia'

export async function GET() {
  try {
    const siman = await getSimanDoDia()
    return NextResponse.json(siman)
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
