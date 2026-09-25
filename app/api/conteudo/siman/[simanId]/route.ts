import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { getSiman } from '@/lib/content/server'

// Texto de um siman. Sem login ou sem acesso, devolve só o primeiro seif como amostra.
// A explicação prática só é incluída para assinantes Plus.
export async function GET(_req: Request, { params }: { params: Promise<{ simanId: string }> }) {
  try {
    const { simanId } = await params
    if (!/^[0-9a-f-]{36}$/i.test(simanId)) {
      return NextResponse.json({ error: 'Siman inválido' }, { status: 400 })
    }

    const { user } = await getAuthenticatedUser()
    const siman = await getSiman(simanId, user?.id ?? null)
    if (!siman) {
      return NextResponse.json({ error: 'Siman não encontrado' }, { status: 404 })
    }

    return NextResponse.json(siman, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Erro ao carregar siman:', error)
    return NextResponse.json({ error: 'Erro ao carregar o siman' }, { status: 500 })
  }
}
